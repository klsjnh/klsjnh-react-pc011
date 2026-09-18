/**
 * 布局顶部：antd Header
 *  - 左：侧边栏收起开关 + 品牌名
 *  - 右：主题色面板 / 数据模式面板 / 通知铃铛 / 用户面板
 *  - 另有「修改密码」弹窗
 *
 * 视觉约定（此前这里参差、不好看的原因）：
 *  ① 字号混用：品牌 16px、模式按钮 14px、铃铛图标 18px、用户名 14px → 现统一为
 *     图标按钮 16px、模式胶囊 12px 加粗、用户名 13px；
 *  ② 命中区不一：Button size="small" 24px / 裸图标 18px / 头像 24px → 现统一 32px 命中区；
 *  ③ 间距过大：gap 20px 让四个控件像四座孤岛 → 现 gap 8px 成组；
 *  ④ 「API」原为主色实心大按钮，比其它控件抢眼 → 现改为描边胶囊 + 状态圆点，弱化存在感。
 *
 * 三个浮层面板（主题色 / 数据模式 / 用户）统一语言：卡片头 + 选项行 + 选中勾。
 * 主题色面板点选后保持展开（方便对比）；数据模式与用户面板选中即关闭。
 *
 * 关于「菜单不能收起」：antd Sider 自带把手在 light 主题下是白底白箭头（见 src/styles/_antd.scss 补的样式），
 * 且固定在视口底部容易被忽略，故在品牌左侧再提供一个显式开关。
 */
import React, { useState } from 'react';
import { Layout, Popover, Avatar, Badge, Modal, Form, Input } from 'antd';
import {
  ApartmentOutlined,
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  LockOutlined,
  BgColorsOutlined,
  CheckOutlined,
  DownOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useCurrentUser, authStore } from '@/stores/authStore';
import { useUnreadCount, notificationStore } from '@/stores/notificationStore';
import { uiStore, useUiState } from '@/stores/uiStore';
import { appConfigStore, useAppConfig, type DataMode } from '@/config/appConfig';
import { THEME_LIST, getThemeColor } from '@/config/theme';
import { themeStore, useThemeKey } from '@/stores/themeStore';
import { reloadMenus, reloadRoles, changePassword } from '@/services/system011';
import { globalConfig } from '@/config/constants';
import { toast } from '@/utils/toast';
import type { TopProps } from '@/types/view/layout';

const { Header } = Layout;

/** 数据模式选项（文案对齐 appConfig 的 DataMode） */
const MODE_OPTIONS: { key: DataMode; name: string; desc: string }[] = [
  { key: 'mock', name: 'Mock 模式', desc: '本地假数据，不依赖后端' },
  { key: 'api', name: 'API 模式', desc: '连接真实后端服务' },
];

export const Top = ({ onNavigate }: TopProps) => {
  const user = useCurrentUser();
  const unread = useUnreadCount();
  const appCfg = useAppConfig();
  const collapsed = useUiState().sidebarCollapsed;
  // 订阅当前主题：此前遗漏了这行，导致下面的 currentTheme 未定义（点开面板直接报错）
  const currentTheme = useThemeKey();
  const [pwdOpen, setPwdOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [form] = Form.useForm();

  const isApi = appCfg.dataMode === 'api';

  const switchMode = async (mode: DataMode) => {
    appConfigStore.setDataMode(mode);
    await Promise.all([reloadMenus(), reloadRoles(), notificationStore.reload()]);
  };

  /** 主题色面板：2 列 × N 行，色块 + 中文名 + 选中勾（点选后保持展开，便于对比） */
  const themePanel = (
    <div className="theme-panel">
      <div className="theme-panel-head">
        <span>主题色</span>
        <em>{THEME_LIST.length} 套可选</em>
      </div>
      <div className="theme-grid">
        {THEME_LIST.map((t) => {
          const active = t.key === currentTheme;
          return (
            <button
              key={t.key}
              type="button"
              className={'theme-item' + (active ? ' active' : '')}
              onClick={() => themeStore.setTheme(t.key)}
            >
              <span
                className="theme-swatch"
                style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color2} 100%)` }}
              />
              <span className="theme-item-name">{t.name}</span>
              {active && <CheckOutlined className="theme-item-check" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  /** 数据模式面板：状态圆点 + 名称 + 说明 + 选中勾 */
  const modePanel = (
    <div className="mode-panel">
      <div className="mode-panel-head">
        <span>数据模式</span>
        <em>切换后重新加载菜单</em>
      </div>
      <div className="mode-list">
        {MODE_OPTIONS.map((m) => {
          const active = appCfg.dataMode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              className={'mode-item' + (active ? ' active' : '')}
              onClick={() => {
                setModeOpen(false);
                if (!active) void switchMode(m.key);
              }}
            >
              <span className={'mode-item-dot is-' + m.key} />
              <span className="mode-item-text">
                <span className="mode-item-name">{m.name}</span>
                <span className="mode-item-desc">{m.desc}</span>
              </span>
              {active && <CheckOutlined className="mode-item-check" />}
            </button>
          );
        })}
      </div>
    </div>
  );

  const roleText = user?.roles?.length ? user.roles.join(' / ') : '未分配角色';

  /** 用户面板：顶部身份卡 + 操作行（退出登录为危险色，用分隔线隔开） */
  const userPanel = (
    <div className="user-panel">
      <div className="user-panel-head">
        <Avatar src={user?.avatar || undefined} icon={<UserOutlined />} size={40} />
        <div className="user-panel-meta">
          <div className="user-panel-name">{user?.realName || '未登录'}</div>
          <div className="user-panel-sub">{user?.username || '-'} · {roleText}</div>
        </div>
      </div>
      <div className="user-panel-actions">
        <button
          type="button"
          className="user-action"
          onClick={() => { setUserOpen(false); onNavigate('/profile'); }}
        >
          <UserOutlined />
          <span>个人信息</span>
        </button>
        <button
          type="button"
          className="user-action"
          onClick={() => { setUserOpen(false); form.resetFields(); setPwdOpen(true); }}
        >
          <LockOutlined />
          <span>修改密码</span>
        </button>
        <div className="user-panel-divider" />
        <button
          type="button"
          className="user-action danger"
          onClick={() => {
            setUserOpen(false);
            if (window.confirm('确定要退出登录吗？')) authStore.logout();
          }}
        >
          <LogoutOutlined />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );

  const savePwd = async () => {
    const v = await form.validateFields();
    if (v.newPwd !== v.confirmPwd) { toast.error('两次输入的新密码不一致'); return; }
    try {
      await changePassword({
        userAccount: user?.username || '',
        oldPassword: v.oldPwd,
        newPassword: v.newPwd,
      });
      setPwdOpen(false);
      form.resetFields();
      toast.success('密码修改成功');
    } catch (e) {
      toast.error((e as Error)?.message || '密码修改失败');
    }
  };

  return (
    <Header className="app-header">
      <div className="app-brand">
        <button
          type="button"
          className="hdr-icon-btn app-brand-toggle"
          title={collapsed ? '展开侧边栏' : '收起侧边栏'}
          aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          onClick={() => uiStore.setSidebarCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        </button>
        <ApartmentOutlined className="app-brand-logo" />
        <span>{globalConfig.appName}</span>
      </div>

      <div className="app-header-actions">
        <Popover
          trigger="click"
          placement="bottomRight"
          arrow={false}
          content={themePanel}
        >
          <button type="button" className="hdr-icon-btn" title="切换主题色">
            <BgColorsOutlined />
            <span className="hdr-theme-dot" style={{ background: getThemeColor(currentTheme) }} />
          </button>
        </Popover>

        <Popover
          trigger="click"
          placement="bottomRight"
          arrow={false}
          open={modeOpen}
          onOpenChange={setModeOpen}
          content={modePanel}
        >
          <button
            type="button"
            className={'hdr-mode' + (isApi ? ' is-api' : '')}
            title={isApi ? '当前：API 模式（真实后端）' : '当前：Mock 模式（本地数据）'}
          >
            <span className="hdr-mode-dot" />
            {isApi ? 'API' : 'MOCK'}
            <DownOutlined className="hdr-mode-caret" />
          </button>
        </Popover>

        <Badge count={unread} size="small" overflowCount={99} offset={[-4, 4]}>
          <button type="button" className="hdr-icon-btn" title="通知" onClick={() => onNavigate('/notifications')}>
            <BellOutlined />
          </button>
        </Badge>

        <Popover
          trigger="click"
          placement="bottomRight"
          arrow={false}
          open={userOpen}
          onOpenChange={setUserOpen}
          content={userPanel}
        >
          <button type="button" className="hdr-user">
            <Avatar src={user?.avatar || undefined} icon={<UserOutlined />} size={28} />
            <span className="hdr-user-name">{user?.realName || '未登录'}</span>
            <DownOutlined className="hdr-user-caret" />
          </button>
        </Popover>
      </div>

      <Modal
        title="修改密码"
        open={pwdOpen}
        onCancel={() => setPwdOpen(false)}
        onOk={savePwd}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="oldPwd" label="原密码" rules={[{ required: true, message: '请输入原密码' }]}>
            <Input.Password placeholder="请输入原密码" />
          </Form.Item>
          <Form.Item name="newPwd" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '至少 6 位' }]}>
            <Input.Password placeholder="至少 6 位" />
          </Form.Item>
          <Form.Item name="confirmPwd" label="确认新密码" rules={[{ required: true, message: '请确认新密码' }]}>
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </Header>
  );
};
