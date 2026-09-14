import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import 'antd/dist/reset.css';
import { App } from '@/App';
import './styles/global.css';

const container = document.getElementById('root');
if (!container) throw new Error('挂载失败：index.html 中缺少 #root 容器');

ReactDOM.createRoot(container).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
