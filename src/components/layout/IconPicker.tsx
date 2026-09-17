/**
 * 图标选择器（QQ 表情面板风格）
 * 点击图标即可选中，用于菜单图标配置。
 */
import { useState } from 'react';
import { Popover, Input } from 'antd';
import type { NavIcon } from '@/types/view/layout';
import { resolveMenuIcon } from '@/components/layout/MenuIcons';

const ALL_ICONS = [
  'ApartmentOutlined','AppstoreAddOutlined','AppstoreOutlined','AreaChartOutlined',
  'BarChartOutlined','BellOutlined','BookOutlined','CalculatorOutlined',
  'ClockCircleOutlined','ControlOutlined','DashboardOutlined','DatabaseOutlined',
  'DesktopOutlined','ExportOutlined','FieldTimeOutlined','FileSearchOutlined',
  'FileTextOutlined','FormOutlined','HddOutlined','InfoCircleOutlined',
  'KeyOutlined','LineChartOutlined','MenuOutlined','MonitorOutlined',
  'NotificationOutlined','PieChartOutlined','QuestionCircleOutlined',
  'SearchOutlined','SettingOutlined','SmileOutlined','TeamOutlined',
  'ThunderboltOutlined','ToolOutlined','UserOutlined','UserSwitchOutlined',
];

interface IconPickerProps {
  value?: string | null;
  onChange?: (value: string) => void;
}

export const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const Icon = value ? resolveMenuIcon(value) : null;

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={
        <div style={{ width: 320, maxHeight: 320, overflow: 'auto', padding: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {ALL_ICONS.map((name) => {
              const I = resolveMenuIcon(name);
              return (
                <div
                  key={name}
                  onClick={() => {
                    onChange?.(name);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '6px 2px', cursor: 'pointer', borderRadius: 6,
                    border: value === name ? '1px solid #1890ff' : '1px solid transparent',
                    background: value === name ? '#e6f7ff' : 'transparent',
                  }}
                >
                  <I style={{ fontSize: 20, color: '#555' }} />
                  <span style={{ fontSize: 11, color: '#888', wordBreak: 'break-all' }}>{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      }
    >
      <Input
        readOnly
        placeholder="选择图标"
        value={value || ''}
        onClick={() => setOpen(true)}
        style={{ cursor: 'pointer' }}
      />
    </Popover>
  );
};
