/**
 * 存储管理（主子表：存储实例 → 存储桶）
 * 路由：/storageCenter/bucketList
 */
import React, { useState } from 'react';
import { StorageInstancePane } from './index';
import { StorageBucketPane } from './index';

export const StorageInstancePage = () => {
  const [selectedCode, setSelectedCode] = useState<string | undefined>();

  return (
    <div className="page-fill">
      <div className="page-header">
        <h2>存储管理</h2>
      </div>
      <StorageInstancePane onSelectInstance={setSelectedCode} />
      {selectedCode && (
        <div style={{ marginTop: 16 }}>
          <StorageBucketPane defaultStorageCode={selectedCode} />
        </div>
      )}
    </div>
  );
};
