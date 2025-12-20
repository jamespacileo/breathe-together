import { useState } from 'react';
import { VisualizationConfig, DEFAULT_CONFIG } from '../lib/config';
import { BreathState } from '../hooks/useBreathSync';
import { PresenceData } from '../hooks/usePresence';
import { SimulationConfig, MOOD_IDS } from '../lib/simulationConfig';
import { getMoodColor, MOODS } from '../lib/colors';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { Label } from './ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface ConfigSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

function ConfigSlider({ label, value, onChange, min, max, step = 0.01 }: ConfigSliderProps) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/70">{label}</span>
        <span className="font-mono text-white/90">
          {typeof value === 'number' ? value.toFixed(step < 1 ? 2 : 0) : value}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function ColorPicker({ label, value, onChange }: ColorPickerProps) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <span className="text-xs text-white/70">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-white/90">{value}</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer bg-transparent border border-white/20"
        />
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function Section({ title, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-3">
      <CollapsibleTrigger className="w-full flex items-center justify-between text-xs uppercase tracking-wide text-white/70 hover:text-white/90 transition-colors mb-2">
        <span>{title}</span>
        <span className="text-sm">{open ? '−' : '+'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

interface SimulationControlsProps {
  simulationConfig: SimulationConfig;
  updateSimulationConfig: (updates: Partial<SimulationConfig>) => void;
  isSimulationRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
}

interface DebugPanelProps {
  config: VisualizationConfig;
  setConfig: (config: VisualizationConfig) => void;
  breathState: BreathState;
  presence: PresenceData;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  simulationControls?: SimulationControlsProps;
}

export function DebugPanel({
  config,
  setConfig,
  breathState,
  presence,
  isOpen,
  setIsOpen,
  simulationControls,
}: DebugPanelProps) {
  const resetToDefaults = () => setConfig({ ...DEFAULT_CONFIG });

  const updateConfig = <K extends keyof VisualizationConfig>(
    key: K,
    value: VisualizationConfig[K]
  ) => {
    setConfig({ ...config, [key]: value });
  };

  const exportConfig = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-50 bg-black/50 backdrop-blur-md"
      >
        Debug
      </Button>
    );
  }

  return (
    <div className="fixed top-4 left-4 z-50 w-72 max-h-[90vh] overflow-y-auto bg-black/80 backdrop-blur-md border border-white/20 rounded-xl text-white text-sm">
      {/* Header */}
      <div className="sticky top-0 bg-black/90 p-3 border-b border-white/10 flex justify-between items-center">
        <span className="font-medium">Debug Panel</span>
        <div className="flex gap-2">
          <Button
            onClick={resetToDefaults}
            variant="ghost"
            size="sm"
            className="text-xs opacity-50 hover:opacity-100"
          >
            Reset
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="ghost"
            size="sm"
            className="text-xs opacity-50 hover:opacity-100"
          >
            ✕
          </Button>
        </div>
      </div>

      <div className="p-3">
        {/* Live State */}
        <Section title="Live State" defaultOpen={true}>
          <div className="text-xs font-mono bg-white/5 rounded p-2 mb-2">
            <div>Phase: {breathState.phase}</div>
            <div>Progress: {(breathState.progress * 100).toFixed(1)}%</div>
            <div>Presence: {presence.count}</div>
          </div>
          {/* Mood breakdown */}
          {presence.moods &&
            Object.values(presence.moods).some((v) => v > 0) && (
              <div className="mt-2">
                <Label className="text-[10px] text-white/60 mb-1 block">
                  Mood Breakdown
                </Label>
                <div className="flex flex-wrap gap-1">
                  {MOOD_IDS.map((moodId) => {
                    const count = presence.moods[moodId] ?? 0;
                    if (count === 0) return null;
                    const mood = MOODS.find((m) => m.id === moodId);
                    return (
                      <div
                        key={moodId}
                        className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded text-[10px]"
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: getMoodColor(moodId) }}
                        />
                        <span className="text-white/70">
                          {mood?.label.split('...')[0] ?? moodId}
                        </span>
                        <span className="font-mono">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </Section>

        {/* Simulation Controls */}
        {simulationControls && (
          <Section title="Simulation" defaultOpen={true}>
            <div className="mb-2 flex gap-2">
              {simulationControls.isSimulationRunning ? (
                <Button
                  onClick={simulationControls.onStop}
                  size="sm"
                  className="flex-1 bg-red-500/20 border-red-500/40 hover:bg-red-500/30"
                >
                  Stop
                </Button>
              ) : (
                <Button
                  onClick={simulationControls.onStart}
                  size="sm"
                  className="flex-1 bg-green-500/20 border-green-500/40 hover:bg-green-500/30"
                >
                  Start
                </Button>
              )}
              <Button
                onClick={simulationControls.onReset}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Reset
              </Button>
            </div>
            <ConfigSlider
              label="Target Population"
              value={simulationControls.simulationConfig.targetPopulation}
              onChange={(v) =>
                simulationControls.updateSimulationConfig({
                  targetPopulation: Math.round(v),
                })
              }
              min={1}
              max={200}
              step={1}
            />
            <ConfigSlider
              label="Stay Duration (sec)"
              value={simulationControls.simulationConfig.meanStayDuration / 1000}
              onChange={(v) =>
                simulationControls.updateSimulationConfig({
                  meanStayDuration: v * 1000,
                })
              }
              min={10}
              max={600}
              step={10}
            />
            <ConfigSlider
              label="Time Scale"
              value={simulationControls.simulationConfig.timeScale}
              onChange={(v) =>
                simulationControls.updateSimulationConfig({ timeScale: v })
              }
              min={1}
              max={50}
              step={1}
            />
          </Section>
        )}

        {/* Particle System */}
        <Section title="Particles">
          <ConfigSlider
            label="Count"
            value={config.particleCount}
            onChange={(v) => updateConfig('particleCount', Math.round(v))}
            min={10}
            max={500}
            step={10}
          />
          <ConfigSlider
            label="Min Size"
            value={config.particleMinSize}
            onChange={(v) => updateConfig('particleMinSize', v)}
            min={0.5}
            max={10}
          />
          <ConfigSlider
            label="Max Size"
            value={config.particleMaxSize}
            onChange={(v) => updateConfig('particleMaxSize', v)}
            min={1}
            max={15}
          />
          <ConfigSlider
            label="Min Opacity"
            value={config.particleMinOpacity}
            onChange={(v) => updateConfig('particleMinOpacity', v)}
            min={0.05}
            max={1}
          />
          <ConfigSlider
            label="Max Opacity"
            value={config.particleMaxOpacity}
            onChange={(v) => updateConfig('particleMaxOpacity', v)}
            min={0.1}
            max={1}
          />
        </Section>

        {/* Spring Physics */}
        <Section title="Spring Physics">
          <ConfigSlider
            label="Tension"
            value={config.springTension}
            onChange={(v) => updateConfig('springTension', v)}
            min={20}
            max={300}
            step={5}
          />
          <ConfigSlider
            label="Tension Variance"
            value={config.springTensionVariance}
            onChange={(v) => updateConfig('springTensionVariance', v)}
            min={0}
            max={100}
            step={5}
          />
          <ConfigSlider
            label="Friction"
            value={config.springFriction}
            onChange={(v) => updateConfig('springFriction', v)}
            min={5}
            max={50}
            step={1}
          />
          <ConfigSlider
            label="Friction Variance"
            value={config.springFrictionVariance}
            onChange={(v) => updateConfig('springFrictionVariance', v)}
            min={0}
            max={30}
            step={1}
          />
        </Section>

        {/* Main Spring */}
        <Section title="Main Spring">
          <ConfigSlider
            label="Tension"
            value={config.mainSpringTension}
            onChange={(v) => updateConfig('mainSpringTension', v)}
            min={20}
            max={200}
            step={5}
          />
          <ConfigSlider
            label="Friction"
            value={config.mainSpringFriction}
            onChange={(v) => updateConfig('mainSpringFriction', v)}
            min={5}
            max={50}
            step={1}
          />
        </Section>

        {/* Breathing Animation */}
        <Section title="Breathing">
          <ConfigSlider
            label="Base Radius"
            value={config.baseRadius}
            onChange={(v) => updateConfig('baseRadius', v)}
            min={0.1}
            max={0.45}
          />
          <ConfigSlider
            label="Breathe In Scale"
            value={config.breatheInScale}
            onChange={(v) => updateConfig('breatheInScale', v)}
            min={0.3}
            max={1}
          />
          <ConfigSlider
            label="Breathe Out Scale"
            value={config.breatheOutScale}
            onChange={(v) => updateConfig('breatheOutScale', v)}
            min={1}
            max={2}
          />
          <ConfigSlider
            label="Hold Oscillation"
            value={config.holdOscillation}
            onChange={(v) => updateConfig('holdOscillation', v)}
            min={0}
            max={0.1}
          />
          <ConfigSlider
            label="Hold Osc Speed"
            value={config.holdOscillationSpeed}
            onChange={(v) => updateConfig('holdOscillationSpeed', v)}
            min={0.001}
            max={0.01}
            step={0.001}
          />
        </Section>

        {/* Movement */}
        <Section title="Movement">
          <ConfigSlider
            label="Wobble Amount"
            value={config.wobbleAmount}
            onChange={(v) => updateConfig('wobbleAmount', v)}
            min={0}
            max={0.2}
          />
          <ConfigSlider
            label="Wobble Speed"
            value={config.wobbleSpeed}
            onChange={(v) => updateConfig('wobbleSpeed', v)}
            min={0.0001}
            max={0.005}
            step={0.0001}
          />
          <ConfigSlider
            label="Radius Min"
            value={config.radiusVarianceMin}
            onChange={(v) => updateConfig('radiusVarianceMin', v)}
            min={0.5}
            max={1}
          />
          <ConfigSlider
            label="Radius Max"
            value={config.radiusVarianceMax}
            onChange={(v) => updateConfig('radiusVarianceMax', v)}
            min={1}
            max={1.5}
          />
          <ConfigSlider
            label="Angle Offset"
            value={config.angleOffsetRange}
            onChange={(v) => updateConfig('angleOffsetRange', v)}
            min={0}
            max={1}
          />
        </Section>

        {/* Visual Effects */}
        <Section title="Visual Effects">
          <ConfigSlider
            label="Glow Intensity"
            value={config.glowIntensity}
            onChange={(v) => updateConfig('glowIntensity', v)}
            min={0}
            max={1}
          />
          <ConfigSlider
            label="Glow Radius"
            value={config.glowRadius}
            onChange={(v) => updateConfig('glowRadius', v)}
            min={1}
            max={3}
          />
          <ConfigSlider
            label="Trail Fade"
            value={config.trailFade}
            onChange={(v) => updateConfig('trailFade', v)}
            min={0.01}
            max={1}
          />
          <ConfigSlider
            label="Core Radius"
            value={config.coreRadius}
            onChange={(v) => updateConfig('coreRadius', v)}
            min={5}
            max={50}
            step={1}
          />
          <ConfigSlider
            label="Core Opacity"
            value={config.coreOpacity}
            onChange={(v) => updateConfig('coreOpacity', v)}
            min={0}
            max={1}
          />
        </Section>

        {/* Presence Particles */}
        <Section title="Presence">
          <ConfigSlider
            label="Max Count"
            value={config.presenceCount}
            onChange={(v) => updateConfig('presenceCount', Math.round(v))}
            min={0}
            max={100}
            step={1}
          />
          <ConfigSlider
            label="Orbit Radius"
            value={config.presenceRadius}
            onChange={(v) => updateConfig('presenceRadius', v)}
            min={1}
            max={2}
          />
          <ConfigSlider
            label="Size"
            value={config.presenceSize}
            onChange={(v) => updateConfig('presenceSize', v)}
            min={1}
            max={10}
            step={0.5}
          />
          <ConfigSlider
            label="Opacity"
            value={config.presenceOpacity}
            onChange={(v) => updateConfig('presenceOpacity', v)}
            min={0.05}
            max={0.5}
          />
          <ConfigSlider
            label="Orbit Speed"
            value={config.presenceOrbitSpeed}
            onChange={(v) => updateConfig('presenceOrbitSpeed', v)}
            min={0}
            max={0.001}
            step={0.00005}
          />
        </Section>

        {/* Colors */}
        <Section title="Colors">
          <ColorPicker
            label="Primary"
            value={config.primaryColor}
            onChange={(v) => updateConfig('primaryColor', v)}
          />
          <ColorPicker
            label="Background"
            value={config.backgroundColor}
            onChange={(v) => updateConfig('backgroundColor', v)}
          />
        </Section>

        {/* Export */}
        <Section title="Export Config">
          <Button
            onClick={exportConfig}
            variant="outline"
            className="w-full text-xs"
          >
            Copy Config to Clipboard
          </Button>
        </Section>
      </div>
    </div>
  );
}
