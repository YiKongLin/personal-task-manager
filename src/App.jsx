import React, { useEffect, useState, useRef } from 'react';
import TaskChart from './TaskChart';
import './App.css';
import Papa from 'papaparse';

const URGENCY_LABELS = ['极低','很低','较低','低','一般','较高','高','很高','极高','紧急','最紧急'];
const IMPORTANCE_LABELS = ['极不重要','很不重要','较不重要','不重要','一般','较重要','重要','很重要','极重要','关键','最关键'];

function getIconByTitle(title) {
  // 可根据标题返回不同图标，这里简单返回圆形
  return 'circle';
}

function loadLocalData() {
  try {
    const data = localStorage.getItem('workplan-data');
    if (data) return JSON.parse(data);
  } catch {}
  return { tasks: [], autoSaveInterval: 30 };
}
function saveLocalData({ tasks, autoSaveInterval }) {
  localStorage.setItem('workplan-data', JSON.stringify({ tasks, autoSaveInterval }));
}

function App() {
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [iconEditing, setIconEditing] = useState(null);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30); // 秒
  const autoSaveTimer = useRef();
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [iconFile, setIconFile] = useState(null);
  const [quickEdit, setQuickEdit] = useState(false);

  // 初始化加载本地缓存
  useEffect(() => {
    let loaded = false;
    if (window.taskAPI) {
      window.taskAPI.getTasks().then(data => {
        if (data && data.tasks && data.tasks.length) {
          setTasks(data.tasks);
          setAutoSaveInterval(data.autoSaveInterval || 30);
          loaded = true;
        }
      });
    }
    if (!loaded) {
      const local = loadLocalData();
      if (local && local.tasks && local.tasks.length) {
        setTasks(local.tasks);
        setAutoSaveInterval(local.autoSaveInterval || 30);
      }
    }
  }, []);

  // 自动保存到本地和 Electron
  useEffect(() => {
    if (autoSaveTimer.current) clearInterval(autoSaveTimer.current);
    autoSaveTimer.current = setInterval(() => {
      saveLocalData({ tasks, autoSaveInterval });
      window.taskAPI && window.taskAPI.saveTasks({ tasks, autoSaveInterval });
    }, autoSaveInterval * 1000);
    return () => clearInterval(autoSaveTimer.current);
  }, [tasks, autoSaveInterval]);

  // 页面关闭/刷新时自动保存
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveLocalData({ tasks, autoSaveInterval });
      window.taskAPI && window.taskAPI.saveTasks({ tasks, autoSaveInterval });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [tasks, autoSaveInterval]);

  const saveTasks = t => {
    setTasks(t);
    saveLocalData({ tasks: t, autoSaveInterval });
    window.taskAPI && window.taskAPI.saveTasks({ tasks: t, autoSaveInterval });
  };

  const handleEdit = idx => setEditing(idx);
  const handleIconEdit = idx => setIconEditing(idx);
  const handleChange = (e, field) => {
    const newTasks = [...tasks];
    newTasks[editing][field] = field === 'urgency' || field === 'importance' ? Number(e.target.value) : e.target.value;
    if (field === 'title') {
      newTasks[editing].icon = getIconByTitle(e.target.value);
    }
    setTasks(newTasks);
  };
  // 图标图片导入
  const handleIconImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      const newTasks = [...tasks];
      newTasks[editing].icon = evt.target.result; // base64
      setTasks(newTasks);
      setIconFile(null);
    };
    reader.readAsDataURL(file);
  };
  const handleSave = () => {
    saveTasks(tasks);
    setEditing(null);
    setIconEditing(null);
  };

  const importFile = e => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        complete: res => {
          const imported = res.data.map(row => ({
            title: row.title,
            urgency: Number(row.urgency),
            importance: Number(row.importance),
            icon: row.icon || getIconByTitle(row.title)
          })).filter(t => t.title);
          saveTasks(imported);
        }
      });
    } else if (ext === 'json') {
      const reader = new FileReader();
      reader.onload = evt => {
        try {
          const imported = JSON.parse(evt.target.result).map(row => ({
            title: row.title,
            urgency: Number(row.urgency),
            importance: Number(row.importance),
            icon: row.icon || getIconByTitle(row.title)
          })).filter(t => t.title);
          saveTasks(imported);
        } catch {}
      };
      reader.readAsText(file, 'utf-8');
    }
  };

  const exportFile = type => {
    if (type === 'csv') {
      const csv = Papa.unparse(tasks);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === 'json') {
      const json = JSON.stringify(tasks, null, 2);
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tasks.json';
      a.click();
      URL.revokeObjectURL(url);
    }
    setExportMenuOpen(false);
  };

  const handleAdd = () => {
    const t = [...tasks, { title: '新任务', urgency: 5, importance: 5, icon: getIconByTitle('新任务') }];
    setTasks(t);
    saveTasks(t);
    setEditing(t.length - 1);
  };

  // 导出下拉菜单控件
  function ExportMenu() {
    return exportMenuOpen ? (
      <div style={{ position: 'absolute', left: 0, top: 38, zIndex: 10, background: '#fff', border: '1px solid #ccc', minWidth: 60 }}>
        <div style={{ padding: 8, cursor: 'pointer' }} onClick={() => exportFile('csv')}>csv</div>
        <div style={{ padding: 8, cursor: 'pointer' }} onClick={() => exportFile('json')}>json</div>
      </div>
    ) : null;
  }

  // 拖动修改任务
  const handleChartDrag = (idx, newUrgency, newImportance) => {
    const newTasks = [...tasks];
    newTasks[idx].urgency = Math.max(0, Math.min(10, newUrgency));
    newTasks[idx].importance = Math.max(0, Math.min(10, newImportance));
    saveTasks(newTasks);
  };

  return (
    <div className="App">
      <h1>个人工作计划表</h1>
      <div className="control-bar">
        <input type="file" accept=".csv,.json" onChange={importFile} />
        <button onClick={() => setQuickEdit(v => !v)} className={quickEdit ? 'quick-edit-active' : ''} aria-pressed={quickEdit}>快速编辑</button>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setExportMenuOpen(v => !v)}>导出</button>
          <ExportMenu />
        </div>
        <button onClick={handleAdd}>添加任务</button>
        <span style={{ marginLeft: 16 }}>自动保存间隔(秒): <input type="number" min={5} max={600} value={autoSaveInterval} onChange={e => setAutoSaveInterval(Number(e.target.value))} style={{ width: 60 }} /></span>
      </div>
      <div className="table-wrap">
        <TaskChart tasks={tasks} onEdit={handleEdit} onIconEdit={handleIconEdit} quickEdit={quickEdit} onChartDrag={handleChartDrag} />
        <table>
          <thead>
            <tr><th>标题</th><th>缓急程度</th><th>重要性</th><th>图标</th><th>操作</th></tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={i}>
                <td>{editing === i ? <input value={t.title} onChange={e => handleChange(e, 'title')} /> : t.title}</td>
                <td>{editing === i ? <input type="number" min={0} max={10} value={t.urgency} onChange={e => handleChange(e, 'urgency')} /> : URGENCY_LABELS[Math.round(t.urgency)] || t.urgency}</td>
                <td>{editing === i ? <input type="number" min={0} max={10} value={t.importance} onChange={e => handleChange(e, 'importance')} /> : IMPORTANCE_LABELS[Math.round(t.importance)] || t.importance}</td>
                <td>
                  {editing === i ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <select value={t.icon && t.icon.startsWith('data:') ? 'image' : (t.icon && t.icon.startsWith('svg:') ? 'svg' : (t.icon && t.icon.startsWith('url:') ? 'url' : t.icon || getIconByTitle(t.title)))} onChange={e => {
                        if (e.target.value === 'image') {
                          setIconFile(i);
                        } else if (e.target.value === 'svg') {
                          const svgStr = prompt('请输入SVG代码（不含<svg>标签）:');
                          if (svgStr) {
                            const svgData = `svg:${btoa(svgStr)}`;
                            const newTasks = [...tasks];
                            newTasks[i].icon = svgData;
                            setTasks(newTasks);
                          }
                        } else if (e.target.value === 'url') {
                          const url = prompt('请输入图片URL:');
                          if (url) {
                            const newTasks = [...tasks];
                            newTasks[i].icon = `url:${url}`;
                            setTasks(newTasks);
                          }
                        } else {
                          const newTasks = [...tasks];
                          newTasks[i].icon = e.target.value;
                          setTasks(newTasks);
                        }
                      }}>
                        <option value="circle">圆形</option>
                        <option value="rect">矩形</option>
                        <option value="triangle">三角形</option>
                        <option value="star">星形</option>
                        <option value="cross">十字</option>
                        <option value="image">图片</option>
                        <option value="url">图片URL</option>
                        <option value="svg">SVG</option>
                      </select>
                      {t.icon && t.icon.startsWith('data:') && <img src={t.icon} alt="icon" style={{ width: 24, height: 24, borderRadius: 4 }} />}
                      {t.icon && t.icon.startsWith('url:') && <img src={t.icon.slice(4)} alt="icon" style={{ width: 24, height: 24, borderRadius: 4 }} />}
                      {t.icon && t.icon.startsWith('svg:') && (
                        <span style={{ width: 24, height: 24, display: 'inline-block' }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: atob(t.icon.slice(4)) }} />
                        </span>
                      )}
                      {iconFile === i && <input type="file" accept="image/*" style={{ width: 120 }} onChange={handleIconImage} />}
                    </div>
                  ) : (
                    t.icon && t.icon.startsWith('data:') ? <img src={t.icon} alt="icon" style={{ width: 24, height: 24, borderRadius: 4 }} /> :
                    t.icon && t.icon.startsWith('url:') ? <img src={t.icon.slice(4)} alt="icon" style={{ width: 24, height: 24, borderRadius: 4 }} /> :
                    t.icon && t.icon.startsWith('svg:') ? <span style={{ width: 24, height: 24, display: 'inline-block' }}><svg width="24" height="24" viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: atob(t.icon.slice(4)) }} /></span> :
                    (t.icon || getIconByTitle(t.title))
                  )}
                </td>
                <td>
                  {editing === i ? (
                    <button onClick={handleSave}>保存</button>
                  ) : (
                    <button onClick={() => setEditing(i)}>编辑</button>
                  )}
                  <button onClick={() => {
                    const t = tasks.filter((_, idx) => idx !== i);
                    setTasks(t);
                    saveTasks(t);
                  }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 智能提示与计划安排区域 */}
      <div style={{marginTop:32, padding:'18px 12px', background:'#f5f7fa', borderRadius:8, boxShadow:'0 2px 8px #0001', textAlign:'left'}}>
        <h3 style={{color:'#2d6cdf',margin:'0 0 10px 0'}}>智能提示与计划安排</h3>
        <ul style={{margin:0,paddingLeft:20}}>
          {tasks.length === 0 && <li>暂无任务，点击“添加任务”开始你的计划。</li>}
          {tasks.map((t,i) => {
            let iconDesc = '';
            if (t.icon && t.icon.startsWith('svg:')) iconDesc = '自定义SVG图标';
            else if (t.icon && t.icon.startsWith('url:')) iconDesc = '网络图片';
            else if (t.icon && t.icon.startsWith('data:')) iconDesc = '本地图像';
            else if (['circle','rect','triangle','star','cross'].includes(t.icon)) iconDesc = '内置形状';
            else iconDesc = '默认图标';
            // 重要性决定字体大小，缓急决定颜色
            const fontSize = 16 + Math.round(t.importance * 2);
            const colorMap = ['#888','#4caf50','#2196f3','#ff9800','#e53935','#d500f9','#00bcd4','#ffb300','#f44336','#c62828','#ad1457'];
            const color = colorMap[Math.min(10, Math.round(t.urgency))];
            // 丰富提示内容
            let plan = '';
            if (t.urgency >= 9 && t.importance >= 9) plan = '极其紧急且极其重要，务必立即专注处理，建议优先安排在今日最清醒时段完成。';
            else if (t.urgency >= 9) plan = '极其紧急但重要性一般，可考虑快速处理或委托他人。';
            else if (t.importance >= 9) plan = '极其重要但不紧急，建议提前规划，分阶段推进，确保高质量完成。';
            else if (t.urgency >= 7 && t.importance >= 7) plan = '较为紧急且重要，建议本周内优先完成。';
            else if (t.urgency >= 7) plan = '较为紧急但重要性一般，可适当简化流程。';
            else if (t.importance >= 7) plan = '较为重要但不紧急，可纳入长期计划，定期回顾进展。';
            else if (t.urgency <= 2 && t.importance <= 2) plan = '既不紧急也不重要，可考虑删除或完全委托。';
            else if (t.urgency <= 2) plan = '不紧急，可延后处理。';
            else if (t.importance <= 2) plan = '不重要，可考虑委托或简化。';
            else plan = '一般任务，可根据实际情况灵活安排。';
            // 友好显示缓急/重要性标签
            const urgencyLabel = URGENCY_LABELS[Math.round(t.urgency)] || t.urgency;
            const importanceLabel = IMPORTANCE_LABELS[Math.round(t.importance)] || t.importance;
            let extra = `（${urgencyLabel} · ${importanceLabel} · ${iconDesc}）`;
            return (
              <li key={i} style={{marginBottom:10}}>
                <span style={{fontWeight:'bold',fontSize:`${16 + Math.round(t.importance * 2)}px`,color}}>{t.title}</span>
                <span style={{marginLeft:8,color:'#666',fontSize:'13px'}}>{extra}</span>
                <div style={{marginTop:2,color:'#444',fontSize:'14px'}}>{plan}</div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

export default App;
