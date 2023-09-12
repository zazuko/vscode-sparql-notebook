
let bNodeIdIndex = 0;
const bNodeMap = new Map<string, string>();

export function shrinkBnode(bNodeId: string): string {
    if (bNodeMap.has(bNodeId)) {
        return bNodeMap.get(bNodeId) ?? '';
    }
    const newBNodeId = `_:b${bNodeIdIndex++}`;
    bNodeMap.set(bNodeId, newBNodeId);
    return newBNodeId;

}
