import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

describe('Design System UI Primitives', () => {
  it('renders Button variants and IconButton', () => {
    const onClick = vi.fn();
    render(
      <div>
        <Button variant="primary" onClick={onClick}>Save</Button>
        <Button variant="secondary">Cancel</Button>
        <Button variant="ghost">More</Button>
        <Button variant="danger">Delete</Button>
        <IconButton label="Add item" onClick={onClick}>
          <Plus size={20} strokeWidth={1.75} />
        </IconButton>
      </div>
    );
    expect(screen.getByText('Save').className).toContain('bg-sky-700');
    expect(screen.getByText('Delete').className).toContain('bg-danger');
    fireEvent.click(screen.getByLabelText('Add item'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders Card, Chip, Stat, Skeleton, Toast, and ProgressRing', () => {
    const onDismiss = vi.fn();
    render(
      <div>
        <Card>Card body</Card>
        <Chip selected>Happy</Chip>
        <Stat value={12} label="Day streak" />
        <Skeleton />
        <Toast message="Saved" onDismiss={onDismiss} />
        <ProgressRing value={50} max={100} label="50%" />
      </div>
    );
    expect(screen.getByText('Card body')).toBeInTheDocument();
    expect(screen.getByText('Happy').className).toContain('bg-sky-700');
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    fireEvent.click(screen.getByLabelText('Dismiss'));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('renders Tabs, SegmentedControl, Modal, BottomSheet, and EmptyState', () => {
    const onChange = vi.fn();
    const onClose = vi.fn();
    const onAction = vi.fn();
    render(
      <div>
        <Tabs items={[{ id: 'a', label: 'Tab A' }, { id: 'b', label: 'Tab B' }]} value="a" onChange={onChange} />
        <SegmentedControl items={[{ id: '1', label: 'Week' }, { id: '2', label: 'Month' }]} value="1" onChange={onChange} />
        <Modal open title="Edit" onClose={onClose}>Modal content</Modal>
        <BottomSheet open title="Options" onClose={onClose}>Sheet content</BottomSheet>
        <EmptyState icon={<Sparkles size={24} strokeWidth={1.75} />} message="Nothing here yet" actionLabel="Create" onAction={onAction} />
      </div>
    );
    fireEvent.click(screen.getByText('Tab B'));
    fireEvent.click(screen.getByText('Month'));
    fireEvent.click(screen.getByText('Create'));
    expect(onChange).toHaveBeenCalledWith('b');
    expect(onChange).toHaveBeenCalledWith('2');
    expect(onAction).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
    expect(screen.getByText('Sheet content')).toBeInTheDocument();
  });

  it('renders Input, Textarea, Toggle, and Slider', () => {
    const onToggle = vi.fn();
    const onSlider = vi.fn();
    render(
      <div>
        <Input label="Title" placeholder="Entry title" />
        <Textarea label="Notes" placeholder="Write here" />
        <Toggle checked={false} onChange={onToggle} label="Enable AI" />
        <Slider label="Mood" min={1} max={10} value={5} onChange={onSlider} />
      </div>
    );
    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Notes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('switch', { name: 'Enable AI' }));
    expect(onToggle).toHaveBeenCalledWith(true);
    expect(screen.getByLabelText('Mood')).toHaveValue('5');
  });
});
