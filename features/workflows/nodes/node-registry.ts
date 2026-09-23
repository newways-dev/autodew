import type { Node } from '@xyflow/react'
import {
  Bell,
  Bot,
  Eye,
  Globe,
  Mail,
  MousePointerClick,
  Pointer,
  ScanText,
  type LucideIcon,
} from 'lucide-react'

export type StepNodeKind = 'trigger' | 'action'

// One editable field on a node, rendered as an input in the inspector later.
export type NodeField = {
  key: string
  label: string
  placeholder?: string
  multiline?: boolean
  required?: boolean
  options?: { value: string; label: string }[]
  defaultValue?: string
}

export type NodeOutput = {
  path: string
  label: string
}

// A node type's manifest entry. Add a node by adding an entry to nodeRegistry.
export type NodeDefinition = {
  type: string
  kind: StepNodeKind
  label: string
  icon: LucideIcon
  accent: string // Tailwind classes for the icon chip color
  fields: NodeField[]
  outputs: NodeOutput[]
}

export const nodeRegistry = {
  start: {
    type: 'start',
    kind: 'trigger',
    label: 'Start',
    icon: MousePointerClick,
    accent: 'bg-blue-500 text-white',
    fields: [],
    outputs: [],
  },
  'open-url': {
    type: 'open-url',
    kind: 'action',
    label: 'Open URL',
    icon: Globe,
    accent: 'bg-emerald-500 text-white',
    fields: [
      {
        key: 'url',
        label: 'URL',
        placeholder: 'https://youtube.com',
        required: true,
      },
    ],
    outputs: [
      { path: 'url', label: 'URL' },
      { path: 'title', label: 'Title' },
    ],
  },
  act: {
    type: 'act',
    kind: 'action',
    label: 'Act',
    icon: Pointer,
    accent: 'bg-violet-500 text-white',
    fields: [
      {
        key: 'instruction',
        label: 'Instruction',
        placeholder: 'Click the sign in button',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: 'success', label: 'Success' },
      { path: 'message', label: 'Message' },
      { path: 'url', label: 'URL' },
    ],
  },
  extract: {
    type: 'extract',
    kind: 'action',
    label: 'Extract',
    icon: ScanText,
    accent: 'bg-amber-500 text-white',
    fields: [
      {
        key: 'instruction',
        label: 'Instruction',
        placeholder: 'Extract the product price',
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: 'extraction', label: 'Extraction' }],
  },
  observe: {
    type: 'observe',
    kind: 'action',
    label: 'Observe',
    icon: Eye,
    accent: 'bg-sky-500 text-white',
    fields: [
      {
        key: 'instruction',
        label: 'Instruction',
        placeholder: 'Find the sign in button',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: 'matches', label: 'Matches' },
      { path: 'matches[0].selector', label: 'Selector' },
      { path: 'matches[0].description', label: 'Description' },
    ],
  },
  agent: {
    type: 'agent',
    kind: 'action',
    label: 'Agent',
    icon: Bot,
    accent: 'bg-rose-500 text-white',
    fields: [
      {
        key: 'instruction',
        label: 'Instruction',
        placeholder: 'Search for the stock price of NVDA',
        multiline: true,
        required: true,
      },
    ],
    outputs: [
      { path: 'success', label: 'Success' },
      { path: 'message', label: 'Message' },
      { path: 'completed', label: 'Completed' },
    ],
  },
  'send-email': {
    type: 'send-email',
    kind: 'action',
    label: 'Send Email',
    icon: Mail,
    accent: 'bg-teal-500 text-white',
    fields: [
      {
        key: 'to',
        label: 'To',
        placeholder: 'person@example.com',
        required: true,
      },
      {
        key: 'subject',
        label: 'Subject',
        placeholder: 'Hello',
        required: true,
      },
      {
        key: 'body',
        label: 'Body',
        placeholder: 'Write your message…',
        multiline: true,
        required: true,
      },
    ],
    outputs: [{ path: 'id', label: 'Email ID' }],
  },
  'notify-on-change': {
    type: 'notify-on-change',
    kind: 'action',
    label: 'Notify on Change',
    icon: Bell,
    accent: 'bg-orange-500 text-white',
    fields: [
      {
        key: 'to',
        label: 'To',
        placeholder: 'person@example.com',
        required: true,
      },
      {
        key: 'subject',
        label: 'Subject',
        placeholder: 'Price changed',
        required: true,
      },
      {
        key: 'value',
        label: 'Value to watch',
        placeholder: '{{ extract.extraction }}',
        multiline: true,
        required: true,
      },
      {
        key: 'provider',
        label: 'AI provider',
        defaultValue: 'google',
        options: [
          { value: 'google', label: 'Google (Gemini)' },
          { value: 'openai', label: 'OpenAI (GPT)' },
          { value: 'anthropic', label: 'Anthropic (Claude)' },
        ],
      },
    ],
    outputs: [
      { path: 'changed', label: 'Changed' },
      { path: 'value', label: 'Value' },
      { path: 'previousValue', label: 'Previous value' },
      { path: 'summary', label: 'Summary' },
    ],
  },
} satisfies Record<string, NodeDefinition>

export type NodeType = keyof typeof nodeRegistry

// Plain JSON only (synced through Liveblocks later). type keys into the registry;
// kind and title are denormalized so the server can read them without the registry.
export type StepNodeData = {
  type: NodeType
  kind: StepNodeKind
  title: string
  values: Record<string, string>
}

export type StepNodeType = Node<StepNodeData, 'step'>

export type ActionNodeType = {
  [K in NodeType]: (typeof nodeRegistry)[K]['kind'] extends 'action' ? K : never
}[NodeType]
