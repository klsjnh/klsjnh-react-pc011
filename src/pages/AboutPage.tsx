/**
 * 关于我们页 - PC 端
 */
import React from 'react';

export const AboutPage: React.FC = () => (
  <div>
    <div className="page-header">
      <h2>关于我们</h2>
      <p>Enterprise Admin Framework</p>
    </div>

    {/* Logo 和版本 */}
    <div className="table-wrapper" style={{ padding: '32px', textAlign: 'center', marginBottom: '16px' }}>
      <div style={{ fontSize: '56px', marginBottom: '12px' }}>🏢</div>
      <div style={{ fontSize: '20px', fontWeight: 700 }}>企业管理系统</div>
      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Enterprise Admin Framework v1.0.0 (PC 端)</div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* 功能特性 */}
      <div className="table-wrapper" style={{ padding: '20px' }}>
        <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>功能特性</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[
            { icon: '👥', label: '用户管理', desc: '完整的用户账号管理体系' },
            { icon: '🔑', label: '权限管理', desc: '细粒度的角色与菜单权限控制' },
            { icon: '📋', label: '菜单管理', desc: '灵活的导航菜单配置' },
            { icon: '💼', label: '业务中心', desc: '配置、数据、工具一站式管理' },
            { icon: '📈', label: '数据报表', desc: '多维度业务数据分析' },
          ].map((item) => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '22px' }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 500 }}>{item.label}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 技术栈 */}
        <div className="table-wrapper" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>技术栈</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['React 18', 'TypeScript', 'Vite 6', 'React Router', 'Zustand'].map((tech) => (
              <span key={tech} style={{ padding: '4px 12px', background: '#f0f5ff', color: '#597ef7', borderRadius: '12px', fontSize: '12px' }}>
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* 联系方式 */}
        <div className="table-wrapper" style={{ padding: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '14px' }}>联系我们</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <div>📧 support@enterprise.com</div>
            <div>📞 400-123-4567</div>
            <div>🌐 www.enterprise.com</div>
          </div>
        </div>
      </div>
    </div>

    {/* 版权 */}
    <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginTop: '24px' }}>
      © 2026 Enterprise Admin Framework. All rights reserved.
    </div>
  </div>
);
