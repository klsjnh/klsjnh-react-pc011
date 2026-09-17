/**
 * 存储桶列表页 - 独立路由 /storageCenter/bucketList
 */
import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import { StorageBucketPane } from '@/pages/storageCenter/StorageCenter';

export const BucketListPage = () => {
  const Header = <div className="page-header"><h2><DatabaseOutlined /> 存储桶列表</h2></div>;
  return (
    <div className="page-fill">
      {Header}
      <StorageBucketPane />
    </div>
  );
};
