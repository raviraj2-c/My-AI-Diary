/* eslint-disable i18next/no-literal-string */
import React, { useState } from 'react';
import { Sparkles, Plus } from 'lucide-react';
import {
  Button,
  IconButton,
  Card,
  Chip,
  Tabs,
  SegmentedControl,
  BottomSheet,
  Modal,
  Input,
  Textarea,
  Toggle,
  Slider,
  EmptyState,
  Stat,
  Skeleton,
  Toast,
  ProgressRing,
} from '../components/ui';

const ShowcaseBlock: React.FC<{ title: string }> = ({ title }) => {
  const [tab, setTab] = useState('one');
  const [seg, setSeg] = useState('week');
  const [toggle, setToggle] = useState(true);
  const [slider, setSlider] = useState(7);
  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <div className="p-6 bg-bg text-text border border-border rounded-card space-y-6">
      <h2 className="text-lg font-semibold">{title}</h2>

      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setModalOpen(true)}>Primary</Button>
        <Button variant="secondary" onClick={() => setSheetOpen(true)}>Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <IconButton label="Add">
          <Plus size={20} strokeWidth={1.75} />
        </IconButton>
      </div>

      <div className="flex flex-wrap gap-2">
        <Chip>Default</Chip>
        <Chip tone="sky">Sky</Chip>
        <Chip selected>Selected</Chip>
        <Chip tone="danger">Safety</Chip>
      </div>

      <Tabs
        items={[{ id: 'one', label: 'Overview' }, { id: 'two', label: 'Trends' }]}
        value={tab}
        onChange={setTab}
      />

      <SegmentedControl
        items={[{ id: 'week', label: 'Week' }, { id: 'month', label: 'Month' }]}
        value={seg}
        onChange={setSeg}
      />

      <Card>
        <div className="grid grid-cols-2 gap-4">
          <Stat value={14} label="Day streak" />
          <ProgressRing value={70} max={100} label="70%" />
        </div>
      </Card>

      <div className="space-y-3">
        <Input label="Entry Title" placeholder="Quiet morning" />
        <Textarea label="Reflection" placeholder="Write a few lines..." />
        <div className="flex items-center justify-between">
          <span className="text-sm">Enable AI</span>
          <Toggle checked={toggle} onChange={setToggle} label="Enable AI" />
        </div>
        <Slider
          label={`Mood (${slider}/10)`}
          min={1}
          max={10}
          value={slider}
          onChange={(e) => setSlider(Number(e.target.value))}
        />
      </div>

      <Skeleton className="h-8 w-full" />
      <Toast message="Changes saved" />
      <EmptyState
        icon={<Sparkles size={24} strokeWidth={1.75} />}
        message="No entries for this day yet."
        actionLabel="Write entry"
        onAction={() => {}}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Modal Preview">
        <p className="text-sm text-muted">Flat 1px border dialog.</p>
      </Modal>
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Bottom Sheet">
        <p className="text-sm text-muted">Mobile-friendly sheet.</p>
      </BottomSheet>
    </div>
  );
};

export const DevUiPage: React.FC = () => (
  <div className="max-w-6xl mx-auto p-6 space-y-6">
    <h1 className="text-xl font-semibold">Design System Preview (/dev/ui)</h1>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <ShowcaseBlock title="Light Mode" />
      </div>
      <div className="dark">
        <ShowcaseBlock title="Dark Mode" />
      </div>
    </div>
  </div>
);

export default DevUiPage;
