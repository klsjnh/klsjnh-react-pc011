/**
 * 配置列表页（julyConfig）页面壳 —— 单表金标准
 * 组件拆分（3 文件）：
 *  - 本壳：页头 + 工具栏（搜索/状态筛选 + 新建/批量删除/备份/导出）+ 组装
 *  - ConfigTable        表格（列定义 / 勾选 / 分页 / 实测高度；行内动作回调上抛）
 *  - ConfigFormModal    新建 / 编辑弹窗（配置值与备注多行）
 * 金标准口径（2026-09-21 用户定稿）：green 新建 / blue 备份 / pink 导出 / danger 批量删除；
 * 行内 filled 小按钮；「新建」不带资源后缀。
 */
import React, { useEffect, useState } from 'react';
import { DatabaseOutlined, DeleteOutlined, DownloadOutlined, DownOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Dropdown, Popconfirm, Select } from 'antd';
import type { MenuProps } from 'antd';
import { useConfigState } from '@/stores/system011/julyConfigStore';
import { KlsjnhPageToolbar011, KlsjnhSearchInput011 } from '@/components/klsjnh011';
import { fetchConfigPage, removeConfig, removeConfigs, exportConfig, backupConfig011 } from '@/services/system011';
import { toast } from '@/utils/toast';
import { ConfigTable } from '@/pages/system011/julyConfig/ConfigTable';
import { ConfigFormModal } from '@/pages/system011/julyConfig/ConfigFormModal';
import type { JulyConfigVo011 } from '@/types/system011/julyConfig';

export const JulyConfig = () => {
  const { query } = useConfigState();
  const [keyword, setKeyword] = useState('');
  const [modal, setModal] = useState<{ open: boolean; node: JulyConfigVo011 | null }>({ open: false, node: null });
  const [actionLoading, setActionLoading] = useState<'export' | 'backup' | null>(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchDeleting, setBatchDeleting] = useState(false);

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchConfigPage({ pageIndex: 1 }); }, []);

  // 导出全部配置 -> 下载细节收敛在 service，页面只反馈结果
  const handleExport = async (format: 'json' | 'csv' = 'csv') => {
    setActionLoading('export');
    try {
      const res = await exportConfig(format);
      toast.success(`export julyConfig success, ${res.rowCount} rows (${format})`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 备份全部配置到存储中心 -> 返回 object key
  const handleBackup = async () => {
    setActionLoading('backup');
    try {
      const key = await backupConfig011();
      toast.success(`backup julyConfig success, key=${key}`);
    } catch (e) {
      toast.error((e as Error)?.message || '备份失败，请重试');
    } finally {
      setActionLoading(null);
    }
  };

  // 导出格式下拉（json / csv）
  const exportMenu: MenuProps = {
    items: [
      { key: 'json', label: 'JSON (.json)' },
      { key: 'csv', label: 'CSV (.csv)' },
    ],
    onClick: ({ key }) => handleExport(key as 'json' | 'csv'),
  };

  const handleRemove = async (id: string) => {
    try {
      await removeConfig(id);
      toast.success(`delete ${id} success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '删除失败，请重试');
    }
  };

  // 批量逻辑删除（选中行 -> service，删除/刷新已收敛在 service；后端无批量端点，service 内循环单删）
  const handleBatchRemove = async () => {
    if (!selectedRowKeys.length) return;
    setBatchDeleting(true);
    try {
      const res = await removeConfigs(selectedRowKeys.map(String));
      setSelectedRowKeys([]);
      toast.success(`批量删除成功 ${res.success} 条，失败 ${res.failed} 条`);
    } catch (e) {
      toast.error((e as Error)?.message || '批量删除失败，请重试');
    } finally {
      setBatchDeleting(false);
    }
  };

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>配置管理</h2>
      </div>

      {/* 工具栏金标准（031 §015/016）：第一行 搜索 + 状态筛选，第二行 新建 + 批量删除 + 备份 + 导出 —— KlsjnhPageToolbar011 原语 */}
      <KlsjnhPageToolbar011
        search={
          <>
            <KlsjnhSearchInput011
              placeholder="搜索 code / data"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={(v) => fetchConfigPage({ pageIndex: 1, keyword: v || undefined })}
            />
            <Select
              style={{ width: 140 }}
              value={query.status ?? ''}
              onChange={(v) => fetchConfigPage({ pageIndex: 1, status: v || undefined })}
              options={[
                { value: '', label: '全部状态' },
                { value: '1', label: '启用' },
                { value: '0', label: '停用' },
              ]}
            />
          </>
        }
        actions={
          <>
          {/* 浅底 tonal（variant="filled"）：五色语义 —— green 新建 / blue 备份 / pink 导出 / danger 批量删除 */}
          <Button
            color="green" variant="filled"
            icon={<PlusOutlined />}
            onClick={() => setModal({ open: true, node: null })}
          >新建</Button>
          <Popconfirm
            title={`确定要删除选中的 ${selectedRowKeys.length} 条配置吗？`}
            okText="删除" cancelText="取消" okButtonProps={{ danger: true }}
            onConfirm={handleBatchRemove}
            disabled={!selectedRowKeys.length}
          >
            <Button
              color="danger" variant="filled"
              icon={<DeleteOutlined />}
              disabled={!selectedRowKeys.length}
              loading={batchDeleting}
            >批量删除</Button>
          </Popconfirm>
          <Button
            color="blue" variant="filled"
            icon={<DatabaseOutlined />}
            loading={actionLoading === 'backup'}
            onClick={handleBackup}
          >备份011</Button>
          <Dropdown menu={exportMenu} trigger={['click']}>
            <Button
              color="pink" variant="filled"
              icon={<DownloadOutlined />}
              loading={actionLoading === 'export'}
            >
              导出 <DownOutlined />
            </Button>
          </Dropdown>
          </>}
      />

      <ConfigTable
        selectedRowKeys={selectedRowKeys}
        onSelectionChange={setSelectedRowKeys}
        onEdit={(row) => setModal({ open: true, node: row })}
        onRemove={handleRemove}
      />

      <ConfigFormModal
        open={modal.open}
        node={modal.node}
        onClose={() => setModal({ open: false, node: null })}
      />
    </div>
  );
};

export default JulyConfig;
