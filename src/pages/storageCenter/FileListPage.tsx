/**
 * 文件列表页 - 独立路由 /storageCenter/fileList
 */
import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import { StorageObjectPane } from '@/pages/storageCenter/StorageCenter';

export const FileListPage = () => {
  const Header = <div className="page-header"><h2><FileTextOutlined /> 文件列表</h2></div>;
  return (
    <div className="page-fill">
      {Header}
      <StorageObjectPane />
    </div>
  );
};
