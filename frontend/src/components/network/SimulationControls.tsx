import { useState } from "react";
import { AlertTriangle, Play } from "lucide-react";

interface SimulationControlsProps {
  devices: {
    id: string;
    name: string;
    type: string;
    status: string;
  }[];

  onFailure: (deviceId: string) => void;
}

function SimulationControls({
  devices,
  onFailure,
}: SimulationControlsProps) {
  const [selectedDevice, setSelectedDevice] =
    useState("edge-05");

  const edgeDevices = devices.filter(
    (device) => device.type === "edge"
  );

  return (
    <div className="simulation-controls">
      <div className="simulation-controls-header">
        <div>
          <p className="panel-eyebrow">
            SIMULATION
          </p>

          <h3>Simulation Controls</h3>
        </div>

        <AlertTriangle size={18} />
      </div>

      <div className="simulation-control-group">
        <label htmlFor="failure-device">
          Target Device
        </label>

        <select
          id="failure-device"
          value={selectedDevice}
          onChange={(event) =>
            setSelectedDevice(event.target.value)
          }
        >
          {edgeDevices.map((device) => (
            <option
              key={device.id}
              value={device.id}
              disabled={device.status === "down"}
            >
              {device.name}
            </option>
          ))}
        </select>
      </div>

      <div className="simulation-control-group">
        <label>Failure Type</label>

        <div className="simulation-failure-type">
          Device Failure
        </div>
      </div>

      <button
        type="button"
        className="simulation-failure-button"
        onClick={() => onFailure(selectedDevice)}
      >
        <Play size={16} />
        Inject Failure
      </button>
    </div>
  );
}

export default SimulationControls;