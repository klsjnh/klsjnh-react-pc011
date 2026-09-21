/**
 * 字典管理（julyDictionary）页面壳
 * 组件拆分（4 文件）：
 *  - 本壳：页头 + 工具栏（搜索/状态筛选 + 新建/导出）+ 组装
 *  - DictionaryTable       主表列表（行内编辑/删除、行点击选中）
 *  - DictionaryFormModal   主表编辑弹窗
 *  - DictionaryItemTable   子表明细（行编辑草稿模型）
 * 弹窗 open/node 状态在本壳持有；选中态（active）在 store，由主表行点击写入、子表消费。
 */
import React, { useEffect, useState } from 'react';
import { Button, Card, Input, Select, Tabs } from 'antd';
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons';
import { useDictionaryState } from '@/stores/system011/julyDictionaryStore';
import { fetchDictionaryPage, exportData } from '@/services/system011';
import { toast } from '@/utils/toast';
import { downloadText, exportFileName } from '@/utils/download';
import { DictionaryTable } from '@/pages/system011/julyDictionary/DictionaryTable';
import { DictionaryFormModal } from '@/pages/system011/julyDictionary/DictionaryFormModal';
import { DictionaryItemTable } from '@/pages/system011/julyDictionary/DictionaryItemTable';
import type { JulyDictionaryVo011 } from '@/types/system011';

/** 本页导出格式（后端 /export/v1 支持 csv / json，字典暂只导出 csv） */
const EXPORT_FORMAT = 'csv';

export const JulyDictionary = () => {
  const { query, active } = useDictionaryState();

  // 主表新建 / 编辑弹窗（表单与提交逻辑都在 DictionaryFormModal 内）
  const [dictModal, setDictModal] = useState<{ open: boolean; node: JulyDictionaryVo011 | null }>({ open: false, node: null });
  /** 搜索关键字（受控；onSearch 才触发请求，与 julyUser 一致） */
  const [keyword, setKeyword] = useState('');

  // 导出（对接 030 /export/v1，objectCode = julyDictionary / julyDictionaryItem）
  const [exporting, setExporting] = useState(false);
  const handleExport = async () => {
    setExporting(true);
    try {
      // /export/v1 直接返回文件内容字符串 → 交给公共下载工具存盘
      const content = await exportData({ objectCode: 'julyDictionary', format: EXPORT_FORMAT });
      downloadText(content, exportFileName('julyDictionary', EXPORT_FORMAT), EXPORT_FORMAT);
      toast.success(`export julyDictionary success ...`);
    } catch (e) {
      toast.error((e as Error)?.message || '导出失败，请重试');
    } finally {
      setExporting(false);
    }
  };

  // 只重置 pageIndex：pageSize 是用户偏好（存在 store 里），传值会把它覆盖回默认值
  useEffect(() => { fetchDictionaryPage({ pageIndex: 1 }); }, []);

  return (
    <div>
      <div className="page-header">
        <h2>字典管理</h2>
      </div>

      {/* 工具栏：与 julyUser 同款两行 —— 第一行搜索 + 状态筛选，第二行动作按钮 */}
      <div className="page-toolbar" style={{ display: 'block' }}>
        <div className="toolbar-row-search" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <Input.Search
            allowClear
            placeholder="搜索编码 / 名称"
            style={{ width: 260 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onSearch={(v) => fetchDictionaryPage({ pageIndex: 1, keyword: v || undefined })}
          />
          <Select
            style={{ width: 140 }}
            value={query.status ?? ''}
            onChange={(v) => fetchDictionaryPage({ pageIndex: 1, status: v || undefined })}
            options={[
              { value: '', label: '全部状态' },
              { value: '1', label: '启用' },
              { value: '0', label: '停用' },
            ]}
          />
        </div>
        <div className="toolbar-right">
          {/* 浅底 tonal（variant="filled"）：颜色表达强度、跟随主题 token，不写死色 */}
          <Button color="primary" variant="filled" icon={<PlusOutlined />}
            onClick={() => setDictModal({ open: true, node: null })}>新建字典</Button>
          <Button color="default" variant="filled" icon={<DownloadOutlined />} loading={exporting}
            onClick={handleExport}>导出</Button>
        </div>
      </div>

      {/* 主表列表（行内编辑 → 弹窗；行点击选中 → 子表跟随） */}
      <DictionaryTable onEdit={(row) => setDictModal({ open: true, node: row })} />

      {/* 子表明细区 */}
      <Card className="table-wrapper" styles={{ body: { padding: 0 } }} style={{ marginTop: 16 }}>
        <Tabs
          className="detail-tabs"
          activeKey="items"
          items={[
            {
              key: 'items',
              label: '明细项',
              children: <DictionaryItemTable active={active} />,
            },
          ]}
        />
      </Card>

      {/* 新建 / 编辑字典弹窗 */}
      <DictionaryFormModal
        open={dictModal.open}
        node={dictModal.node}
        onClose={() => setDictModal({ open: false, node: null })}
      />
    </div>
  );
};

export default JulyDictionary;
