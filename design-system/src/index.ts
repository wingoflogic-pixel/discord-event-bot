// EventBot Design System — 公開エントリ（barrel）。全コンポーネントをここから export。
// 共有CSSコア(styles/index.css)を併せて読み込むこと（このファイルは CSS を import しない）。
export { cn } from './cn';

// --- Buttons / Form ---
export { Button } from './components/Button';
export type { ButtonProps, ButtonVariant, ButtonSize } from './components/Button';
export { TextField } from './components/TextField';
export type { TextFieldProps } from './components/TextField';
export { Textarea } from './components/Textarea';
export type { TextareaProps } from './components/Textarea';
export { Select } from './components/Select';
export type { SelectProps } from './components/Select';
export { Checkbox } from './components/Checkbox';
export type { CheckboxProps } from './components/Checkbox';

// --- Display / Feedback ---
export { Pill } from './components/Pill';
export type { PillProps, PillTone } from './components/Pill';
export { Toast } from './components/Toast';
export type { ToastProps, ToastTone } from './components/Toast';
export { SummaryBanner } from './components/SummaryBanner';
export type { SummaryBannerProps } from './components/SummaryBanner';
export { EmptyState } from './components/EmptyState';
export type { EmptyStateProps } from './components/EmptyState';
export { InlineCode } from './components/InlineCode';
export type { InlineCodeProps } from './components/InlineCode';
export { Modal } from './components/Modal';
export type { ModalProps } from './components/Modal';

// --- Surfaces / Containers ---
export { Card } from './components/Card';
export type { CardProps } from './components/Card';
export { ListRow } from './components/ListRow';
export type { ListRowProps } from './components/ListRow';
export { Table } from './components/Table';
export type { TableProps } from './components/Table';
export { Fieldset } from './components/Fieldset';
export type { FieldsetProps } from './components/Fieldset';

// --- Layout / Shell ---
export { Shell, Main, Row, Row3, GridCards, Actions } from './components/Layout';
export type { ShellProps, MainProps, RowProps, Row3Props, GridCardsProps, ActionsProps } from './components/Layout';
export { SideNav, NavItem } from './components/Nav';
export type { SideNavProps, NavItemProps } from './components/Nav';
export { ServerRail, ServerRailItem, ServerRailDivider } from './components/ServerRail';
export type { ServerRailProps, ServerRailItemProps, ServerRailDividerProps } from './components/ServerRail';
export { Topbar, Avatar, ServerBadge } from './components/Topbar';
export type { TopbarProps, AvatarProps, ServerBadgeProps } from './components/Topbar';

// --- App-specific（スケジューリング / 選択） ---
export { TimeChip, SlotGroup } from './components/Slots';
export type { TimeChipProps, SlotGroupProps } from './components/Slots';
export { PickRow, SearchBox } from './components/Pick';
export type { PickRowProps, SearchBoxProps } from './components/Pick';

// --- Settings patterns（Discord 設定画面風） ---
export { Switch } from './components/Switch';
export type { SwitchProps } from './components/Switch';
export { Radio, RadioGroup } from './components/Radio';
export type { RadioProps, RadioGroupProps } from './components/Radio';
export { SettingRow } from './components/SettingRow';
export type { SettingRowProps } from './components/SettingRow';
export { NavRow } from './components/NavRow';
export type { NavRowProps } from './components/NavRow';
export { Divider } from './components/Divider';
export type { DividerProps } from './components/Divider';
export { Alert } from './components/Alert';
export type { AlertProps, AlertTone } from './components/Alert';
export { SubTabs, SubTab } from './components/SubTabs';
export type { SubTabsProps, SubTabProps } from './components/SubTabs';
export { DropdownButton } from './components/DropdownButton';
export type { DropdownButtonProps } from './components/DropdownButton';
