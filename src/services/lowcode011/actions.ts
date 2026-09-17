/**
 * lowcode011 模块 action 路径常量。
 * 与后端控制器前缀一致：/klsjnh/lowcode011/julyMetadata/v1/*。
 * 调用 api.post/get 时通过 baseOverride 传 '/klsjnh/lowcode011'，
 * 因此此处 action 只写相对路径（与 mock 分发 key 完全一致）。
 *
 * ⚠️ 方法错配本项目一律报 **500**（不是 405），改前先确认 GET/POST：
 *  - GET（query 传参）：getById / getByObjectName / listModels / load / previewDdl / importStatus
 *  - POST（body）：selectListByPage / insert / update / designerSave / logicDelete / logicDeleteBatch
 *    / publish / importDataFromSql
 *
 * 【两组口径并存，勿混】
 *  - CRUD 组（038）：insert / update，子表键名 fieldCode / fieldName / fieldLength / requiredField
 *  - 设计器组（039 一期，2026-09-17 上线）：load / designerSave，走 MetaDTO，
 *    三子在**顶层**且键名为短名 code / name / length / notNull（见 JulyMetadataMetaDto011）
 */
export const LOWCODE011_ACTIONS = {
  metadata: {
    /* ---- 038 CRUD（一主三子，子表长键名） ---- */
    getById: '/julyMetadata/v1/getById',
    getByObjectName: '/julyMetadata/v1/getByObjectName',
    selectListByPage: '/julyMetadata/v1/selectListByPage',
    insert: '/julyMetadata/v1/insert',
    update: '/julyMetadata/v1/update',
    logicDelete: '/julyMetadata/v1/logicDelete',
    logicDeleteBatch: '/julyMetadata/v1/logicDeleteBatch',
    /* ---- 039 一期 设计器（MetaDTO，三子顶层短键名） ---- */
    listModels: '/julyMetadata/v1/listModels',
    load: '/julyMetadata/v1/load',
    /** 新增或修改由后端按 objectName 自行判定（前端不传 id） */
    designerSave: '/julyMetadata/v1/save',
    /** 与 publish 共用同一 DDL 生成器；返回 { ddl } */
    previewDdl: '/julyMetadata/v1/previewDdl',
    /* ---- 039 二期 发布 / 数据同步（2026-09-17 后端上线） ---- */
    /** body { objectName, migrateData, includeDeleted }；返回 { version, publishStatus, physicalTable, ddl } */
    publish: '/julyMetadata/v1/publish',
    /** body { objectName, dataSourceCode, sqlCode, pageNum, pageSize, forceInit }（前三个必填） */
    importDataFromSql: '/julyMetadata/v1/importDataFromSql',
    /** GET；query { objectName }；返回 { dataInitialized, physicalTable, publishStatus } */
    importStatus: '/julyMetadata/v1/importStatus',
  },
} as const;
