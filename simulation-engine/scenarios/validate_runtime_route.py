import sumolib

def validate_route(net, edges):
    """
    Validates that every consecutive pair of edges in the route has a valid physical connection
    in the SUMO network.
    Returns (True, None) if valid, or (False, "edge1 -> edge2") if an invalid transition is found.
    """
    if not edges or len(edges) < 1:
        return False, "Empty route"
        
    for i in range(len(edges) - 1):
        e1_id = edges[i]
        e2_id = edges[i+1]
        
        # Internal edges aren't strictly connected in the same way in sumolib,
        # but in our routes we generally only check macroscopic edges.
        if e1_id.startswith(":") or e2_id.startswith(":"):
            continue
            
        e1 = net.getEdge(e1_id)
        valid = False
        for out_edge in e1.getOutgoing():
            if out_edge.getID() == e2_id:
                valid = True
                break
                
        if not valid:
            return False, f"{e1_id} -> {e2_id}"
            
    return True, None

def path_exists(net, start_id, end_id, closed_id):
    """
    A simple BFS to verify if ANY physical path exists from start_id to end_id
    that avoids closed_id entirely.
    """
    if start_id == end_id:
        return True
        
    visited = set([start_id])
    queue = [start_id]
    
    while queue:
        curr = queue.pop(0)
        if curr == end_id:
            return True
            
        if curr.startswith(":"):
            continue
            
        curr_obj = net.getEdge(curr)
        for out_edge in curr_obj.getOutgoing():
            out_id = out_edge.getID()
            
            # Skip the closed edge completely
            if out_id == closed_id:
                continue
                
            # Skip non-passenger edges
            if not out_edge.allows("passenger"):
                continue
                
            if out_id not in visited:
                visited.add(out_id)
                queue.append(out_id)
                
    return False

def build_path_excluding_edge(net, start_id, end_id, closed_id):
    """Return a concrete edge path from start_id to end_id avoiding closed_id, or None."""
    if start_id == end_id:
        return [start_id]

    visited = {start_id}
    queue = [(start_id, [start_id])]

    while queue:
        curr, path = queue.pop(0)
        if curr == end_id:
            return path

        if curr.startswith(":"):
            continue

        curr_obj = net.getEdge(curr)
        for out_edge in curr_obj.getOutgoing():
            out_id = out_edge.getID()
            if out_id == closed_id:
                continue
            if not out_edge.allows("passenger"):
                continue
            if out_id in visited:
                continue
            visited.add(out_id)
            queue.append((out_id, path + [out_id]))

    return None
