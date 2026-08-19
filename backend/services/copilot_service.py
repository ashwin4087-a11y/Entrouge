import json
import os
import re

from openai import OpenAI

from services.simulation_service import get_road_network, run_simulation
from simulation.models import (
    CopilotRequest,
    CopilotResponse,
    CopilotScenario,
    ScenarioAction,
    ScenarioModification,
    SimulationRequest,
    TimeProfile,
)

COPILOT_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_scenario",
            "description": "Create a traffic simulation scenario from user request",
            "parameters": {
                "type": "object",
                "properties": {
                    "road_name": {
                        "type": "string",
                        "description": "Name of the road to modify (e.g. Anna Salai)",
                    },
                    "action": {
                        "type": "string",
                        "enum": ["close", "restrict", "slow"],
                        "description": "Type of road modification",
                    },
                    "duration_hours": {
                        "type": "number",
                        "description": "Duration of the scenario in hours",
                    },
                    "time_profile": {
                        "type": "string",
                        "enum": ["morning_rush", "evening_rush", "off_peak", "all_day"],
                        "description": "Traffic demand time profile",
                    },
                    "description": {
                        "type": "string",
                        "description": "Brief scenario description",
                    },
                },
                "required": ["road_name", "action", "duration_hours", "time_profile"],
            },
        },
    }
]

SYSTEM_PROMPT = """You are Entrouge Copilot, an AI assistant for urban mobility simulation in Chennai, India.
You help planners create what-if traffic scenarios and explain simulation results.

Known major roads: Anna Salai, Mount Road, Poonamallee High Road, Cathedral Road, Egmore Road, Beach Road.

When the user asks to simulate a scenario, call create_scenario with extracted parameters.
When the user asks why something happened or wants explanation, provide clear analysis based on the simulation context provided.
Suggest mitigations when appropriate (alternate routes, signal timing, partial closures)."""


def _parse_scenario_locally(message: str) -> CopilotScenario | None:
    """Fallback when OpenAI is unavailable."""
    msg = message.lower()
    road_patterns = [
        (r"anna\s*salai", "Anna Salai"),
        (r"mount\s*road", "Mount Road"),
        (r"poonamallee", "Poonamallee High Road"),
        (r"cathedral", "Cathedral Road"),
        (r"egmore", "Egmore Road"),
        (r"beach\s*road", "Beach Road"),
    ]
    road_name = None
    for pattern, name in road_patterns:
        if re.search(pattern, msg):
            road_name = name
            break
    if not road_name:
        return None

    action = ScenarioAction.CLOSE
    if "restrict" in msg or "reduce" in msg:
        action = ScenarioAction.RESTRICT
    elif "slow" in msg:
        action = ScenarioAction.SLOW

    duration = 3.0
    m = re.search(r"(\d+)\s*hour", msg)
    if m:
        duration = float(m.group(1))

    time_profile = TimeProfile.EVENING_RUSH
    if "morning" in msg:
        time_profile = TimeProfile.MORNING_RUSH
    elif "off.?peak" in msg or "off peak" in msg:
        time_profile = TimeProfile.OFF_PEAK

    network = get_road_network()
    edge_ids = network.find_edges_by_name(road_name)

    return CopilotScenario(
        road_name=road_name,
        edge_ids=edge_ids,
        action=action,
        duration_hours=duration,
        time_profile=time_profile,
        description=f"{action.value} {road_name} for {duration}h ({time_profile.value})",
    )


def _explain_locally(message: str, context: dict | None) -> str:
    ctx = context or {}
    alternates = ctx.get("alternate_routes", [])
    delta_tt = ctx.get("delta_travel_time_pct", 0)
    delta_co2 = ctx.get("delta_co2_kg", 0)

    if "why" in message.lower() or "explain" in message.lower():
        parts = [
            "When the primary arterial is closed, traffic diverts to parallel routes with lower capacity.",
        ]
        if alternates:
            parts.append(
                f"Alternate routes seeing increased load: {', '.join(alternates)}."
            )
        parts.append(
            f"Average travel time increased by {delta_tt:.1f}%, adding roughly {delta_co2:.1f} kg CO₂."
        )
        parts.append(
            "Mitigation: extend green time on Mount Road signals, deploy traffic officers at key junctions, "
            "or implement a partial closure with one lane remaining open."
        )
        return " ".join(parts)

    return (
        "I can help you simulate road closures or explain simulation results. "
        "Try: 'Close Anna Salai for 3 hours during evening rush' or 'Why did Mount Road get worse?'"
    )


def handle_copilot_message(request: CopilotRequest) -> CopilotResponse:
    api_key = os.getenv("OPENAI_API_KEY")
    message = request.message.strip()
    context = request.context

    # Explanation mode when context has simulation results
    if context and ("why" in message.lower() or "explain" in message.lower()):
        if api_key:
            try:
                client = OpenAI(api_key=api_key)
                resp = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {
                            "role": "user",
                            "content": f"Simulation context: {json.dumps(context)}\n\nUser question: {message}",
                        },
                    ],
                    temperature=0.4,
                )
                return CopilotResponse(
                    type="explanation",
                    message=resp.choices[0].message.content or _explain_locally(message, context),
                )
            except Exception:
                pass
        return CopilotResponse(
            type="explanation",
            message=_explain_locally(message, context),
        )

    # Scenario creation mode
    scenario = None
    if api_key:
        try:
            client = OpenAI(api_key=api_key)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": message},
                ],
                tools=COPILOT_TOOLS,
                tool_choice="auto",
                temperature=0.2,
            )
            choice = resp.choices[0]
            if choice.message.tool_calls:
                args = json.loads(choice.message.tool_calls[0].function.arguments)
                network = get_road_network()
                road_name = args.get("road_name", "")
                edge_ids = network.find_edges_by_name(road_name)
                scenario = CopilotScenario(
                    road_name=road_name,
                    edge_ids=edge_ids,
                    action=ScenarioAction(args.get("action", "close")),
                    duration_hours=args.get("duration_hours", 3.0),
                    time_profile=TimeProfile(args.get("time_profile", "evening_rush")),
                    description=args.get("description", ""),
                )
        except Exception:
            scenario = _parse_scenario_locally(message)
    else:
        scenario = _parse_scenario_locally(message)

    if not scenario or not scenario.edge_ids:
        return CopilotResponse(
            type="error",
            message=(
                "I couldn't identify a road in your request. "
                "Try mentioning Anna Salai, Mount Road, or Poonamallee High Road."
            ),
        )

    sim_request = SimulationRequest(
        modifications=[
            ScenarioModification(edge_id=eid, action=scenario.action)
            for eid in scenario.edge_ids
        ],
        time_profile=scenario.time_profile,
        duration_hours=scenario.duration_hours,
    )
    result = run_simulation(sim_request)

    summary = (
        f"Scenario: {scenario.description or scenario.road_name}. "
        f"Travel time +{result.delta_travel_time_pct:.1f}%, "
        f"congestion +{result.delta_congestion:.1f}, "
        f"{result.affected_commuters} commuters affected. "
        f"Alternate routes: {', '.join(result.alternate_routes) or 'none significant'}."
    )

    return CopilotResponse(
        type="scenario",
        message=summary,
        scenario=scenario,
        simulation=result,
    )
