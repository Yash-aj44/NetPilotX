from pydantic import BaseModel
from typing import List


class NetworkNode(BaseModel):
    id: str
    name: str
    type: str
    status: str


class NetworkEdge(BaseModel):
    source: str
    target: str
    status: str


class NetworkTopology(BaseModel):
    nodes: List[NetworkNode]
    edges: List[NetworkEdge]