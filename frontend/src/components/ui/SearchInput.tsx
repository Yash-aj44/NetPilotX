import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Server, AlertTriangle } from "lucide-react";
import { useNetwork } from "../../context/NetworkContext";

export default function SearchInput() {
  const navigate = useNavigate();
  const { topology, incidents } = useNetwork();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const nodes = topology?.nodes ?? [];
  const searchLower = query.toLowerCase().trim();

  const matchingNodes = searchLower
    ? nodes.filter(
        (n) =>
          n.id.toLowerCase().includes(searchLower) ||
          n.name.toLowerCase().includes(searchLower) ||
          n.type.toLowerCase().includes(searchLower)
      )
    : [];

  const matchingIncidents = searchLower
    ? incidents.filter(
        (inc) =>
          inc.id.toLowerCase().includes(searchLower) ||
          inc.deviceName.toLowerCase().includes(searchLower) ||
          inc.deviceId.toLowerCase().includes(searchLower)
      )
    : [];

  const hasResults = matchingNodes.length > 0 || matchingIncidents.length > 0;

  const handleSelectNode = (nodeId: string) => {
    setQuery("");
    setIsOpen(false);
    navigate(`/network?device=${nodeId}`);
  };

  const handleSelectIncident = () => {
    setQuery("");
    setIsOpen(false);
    navigate("/incidents");
  };

  return (
    <div className="header-search-container" ref={dropdownRef}>
      <div className="header-search-box">
        <Search size={16} className="search-icon" />
        <input
          type="text"
          placeholder="Search devices, incidents, IPs (e.g. EDGE-05)..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {isOpen && searchLower && (
        <div className="search-dropdown-results">
          {!hasResults ? (
            <div className="search-no-results">
              No devices or incidents matching "{query}"
            </div>
          ) : (
            <>
              {matchingNodes.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <Server size={14} />
                    <span>DEVICES ({matchingNodes.length})</span>
                  </div>
                  {matchingNodes.slice(0, 6).map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      className="search-result-item"
                      onClick={() => handleSelectNode(node.id)}
                    >
                      <div className="search-result-info">
                        <strong>{node.name}</strong>
                        <span className="search-result-sub">{node.type.toUpperCase()} • ID: {node.id}</span>
                      </div>
                      <span className={`status-badge-mini ${node.status}`}>
                        {node.status.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {matchingIncidents.length > 0 && (
                <div className="search-section">
                  <div className="search-section-header">
                    <AlertTriangle size={14} />
                    <span>INCIDENTS ({matchingIncidents.length})</span>
                  </div>
                  {matchingIncidents.slice(0, 4).map((inc) => (
                    <button
                      key={inc.id}
                      type="button"
                      className="search-result-item"
                      onClick={handleSelectIncident}
                    >
                      <div className="search-result-info">
                        <strong>{inc.id}: {inc.deviceName}</strong>
                        <span className="search-result-sub">{inc.affectedSystems} systems affected</span>
                      </div>
                      <span className={`status-badge-mini ${inc.status}`}>
                        {inc.status.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
