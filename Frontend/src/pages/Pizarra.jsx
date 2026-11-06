//src/pages/Pizarra.jsx

import { useState, useRef, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client'; 
import { ArrowLeft, Send, Mic, Camera, ChevronDown, Trash2, Plus, X, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen, Upload, Download, Code } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, { Background, Controls, MiniMap, applyNodeChanges, applyEdgeChanges, Handle, Position, BaseEdge, EdgeLabelRenderer, getStraightPath, addEdge, updateEdge, useReactFlow, useNodes } from 'reactflow';
import 'reactflow/dist/style.css';

// ==========================================
// COMPONENTE: CLASE UML
// ==========================================
const UmlClassNode = ({ data, selected }) => {
  return (
    <div className={`bg-white border-2 shadow-md font-sans text-sm min-w-[200px] rounded-sm relative group ${selected ? 'border-blue-500 shadow-blue-200 shadow-lg' : 'border-gray-800'}`}>
      <div className={`border-b-2 font-bold text-center py-2 px-3 text-black ${selected ? 'bg-blue-100 border-blue-500' : 'bg-blue-50 border-gray-800'}`}>
        {data.label}
      </div>
      <div className={`border-b-2 p-3 min-h-[40px] text-gray-700 font-mono text-xs ${selected ? 'border-blue-500' : 'border-gray-800'}`}>
        {data.atributos && data.atributos.length > 0 
          ? data.atributos.map((attr, i) => <div key={i}>{attr}</div>)
          : <div className="text-transparent">_</div>}
      </div>
      <div className="p-3 min-h-[40px] text-gray-700 font-mono text-xs">
        {data.metodos && data.metodos.length > 0 
          ? data.metodos.map((met, i) => <div key={i}>{met}</div>)
          : <div className="text-transparent">_</div>}
      </div>

      <Handle type="target" position={Position.Top} id="t-t-1" style={{ left: '25%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Top} id="t-s-1" style={{ left: '25%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Top} id="t-t-2" style={{ left: '50%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Top} id="t-s-2" style={{ left: '50%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Top} id="t-t-3" style={{ left: '75%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Top} id="t-s-3" style={{ left: '75%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />

      <Handle type="target" position={Position.Bottom} id="b-t-1" style={{ left: '25%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="b-s-1" style={{ left: '25%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Bottom} id="b-t-2" style={{ left: '50%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="b-s-2" style={{ left: '50%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Bottom} id="b-t-3" style={{ left: '75%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Bottom} id="b-s-3" style={{ left: '75%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />

      <Handle type="target" position={Position.Left} id="l-t-1" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Left} id="l-s-1" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Left} id="l-t-2" style={{ top: '50%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Left} id="l-s-2" style={{ top: '50%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Left} id="l-t-3" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Left} id="l-s-3" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />

      <Handle type="target" position={Position.Right} id="r-t-1" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="r-s-1" style={{ top: '25%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Right} id="r-t-2" style={{ top: '50%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="r-s-2" style={{ top: '50%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
      <Handle type="target" position={Position.Right} id="r-t-3" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-gray-800 opacity-0 group-hover:opacity-100 transition-opacity" />
      <Handle type="source" position={Position.Right} id="r-s-3" style={{ top: '75%' }} className="w-2.5 h-2.5 !bg-transparent !border-none" />
    </div>
  );
};

// ==========================================
// COMPONENTES: RELACIONES UML
// ==========================================
const AssociativeLinkEdge = ({ sourceX, sourceY, data }) => {
  const nodes = useNodes();
  const origSource = nodes.find(n => n.id === data?.originalSource);
  const origTarget = nodes.find(n => n.id === data?.originalTarget);

  let targetX = sourceX;
  let targetY = sourceY + 100;

  if (origSource && origTarget) {
    const sX = origSource.position.x;
    const sY = origSource.position.y;
    const tX = origTarget.position.x;
    const tY = origTarget.position.y;
    const wS = origSource.width || 200;
    const hS = origSource.height || 120;
    const wT = origTarget.width || 200;
    const hT = origTarget.height || 120;

    targetX = (sX + wS / 2 + tX + wT / 2) / 2;
    targetY = (sY + hS / 2 + tY + hT / 2) / 2;
  }

  const [edgePath] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge path={edgePath} style={{ stroke: '#6b7280', strokeWidth: 2, strokeDasharray: '6,4' }} />;
};

const CustomUMLEdge = ({ id, sourceX, sourceY, targetX, targetY, data, selected }) => {
  const { setEdges, setNodes, getNodes } = useReactFlow(); 
  const type = data?.label || 'Asociación';
  
  const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
  const isDashed = type === 'Dependencia' || type === 'Realización';
  const showMultiplicity = ['Asociación', 'Agregación', 'Composición'].includes(type);

  let lineStartX = sourceX;
  let lineStartY = sourceY;
  let lineEndX = targetX;
  let lineEndY = targetY;

  if (type === 'Agregación' || type === 'Composición') {
    lineStartX = sourceX + Math.cos(angle) * 20;
    lineStartY = sourceY + Math.sin(angle) * 20;
  } else if (type === 'Generalización' || type === 'Realización' || type === 'Dependencia') {
    lineEndX = targetX - Math.cos(angle) * 16;
    lineEndY = targetY - Math.sin(angle) * 16;
  }

  const [edgePath, labelX, labelY] = getStraightPath({ sourceX: lineStartX, sourceY: lineStartY, targetX: lineEndX, targetY: lineEndY });

  const renderSymbols = () => {
    const strokeColor = selected ? '#3b82f6' : '#1f2937'; 
    if (type === 'Generalización' || type === 'Realización') {
      const t1X = targetX - Math.cos(angle - Math.PI / 6) * 16;
      const t1Y = targetY - Math.sin(angle - Math.PI / 6) * 16;
      const t2X = targetX - Math.cos(angle + Math.PI / 6) * 16;
      const t2Y = targetY - Math.sin(angle + Math.PI / 6) * 16;
      return <polygon points={`${targetX},${targetY} ${t1X},${t1Y} ${t2X},${t2Y}`} fill="white" stroke={strokeColor} strokeWidth="1.5" />;
    }
    if (type === 'Agregación' || type === 'Composición') {
      const endX = sourceX + Math.cos(angle) * 20;
      const endY = sourceY + Math.sin(angle) * 20;
      const midX = sourceX + Math.cos(angle) * 10;
      const midY = sourceY + Math.sin(angle) * 10;
      const w1X = midX + Math.cos(angle + Math.PI / 2) * 8;
      const w1Y = midY + Math.sin(angle + Math.PI / 2) * 8;
      const w2X = midX - Math.cos(angle + Math.PI / 2) * 8;
      const w2Y = midY - Math.sin(angle + Math.PI / 2) * 8;
      return <polygon points={`${sourceX},${sourceY} ${w1X},${w1Y} ${endX},${endY} ${w2X},${w2Y}`} fill={type === 'Composición' ? strokeColor : 'white'} stroke={strokeColor} strokeWidth="1.5" />;
    }
    if (type === 'Dependencia') {
      const a1X = targetX - Math.cos(angle - Math.PI / 7) * 12;
      const a1Y = targetY - Math.sin(angle - Math.PI / 7) * 12;
      const a2X = targetX - Math.cos(angle + Math.PI / 7) * 12;
      const a2Y = targetY - Math.sin(angle + Math.PI / 7) * 12;
      return (
        <g>
          <line x1={a1X} y1={a1Y} x2={targetX} y2={targetY} stroke={strokeColor} strokeWidth="1.5" />
          <line x1={a2X} y1={a2Y} x2={targetX} y2={targetY} stroke={strokeColor} strokeWidth="1.5" />
        </g>
      );
    }
    return null;
  };

  const crearTablaIntermedia = (edgeActual) => {
    const todosLosNodos = getNodes();
    const nodoOrigen = todosLosNodos.find(n => n.id === edgeActual.source);
    const nodoDestino = todosLosNodos.find(n => n.id === edgeActual.target);
    if (!nodoOrigen || !nodoDestino) return;

    const midX = (nodoOrigen.position.x + nodoDestino.position.x) / 2;
    const midY = Math.min(nodoOrigen.position.y, nodoDestino.position.y) - 180; 

    const nombreOrigen = nodoOrigen.data.label.replace('<<interface>>\n', '');
    const nombreDestino = nodoDestino.data.label.replace('<<interface>>\n', '');
    const idNuevaClase = `nodo-assoc-${Date.now()}`;

    const nuevaClase = {
      id: idNuevaClase,
      type: 'umlClass',
      position: { x: midX, y: midY },
      data: {
        label: `${nombreOrigen}_${nombreDestino}`,
        atributos: [`+ id_${nombreOrigen.toLowerCase()}: int`, `+ id_${nombreDestino.toLowerCase()}: int`],
        metodos: []
      }
    };

    const lineaSegmentada = {
      id: `edge-assoc-${Date.now()}`,
      source: idNuevaClase,
      target: edgeActual.target, 
      type: 'associativeLink', 
      data: { originalSource: edgeActual.source, originalTarget: edgeActual.target },
    };

    setNodes(nds => [...nds, nuevaClase]);
    setEdges(eds => [...eds, lineaSegmentada]);
  };

  const actualizarMultiplicidad = (tipo, valor) => {
    setEdges((eds) => {
      const nuevosEdges = eds.map(e => e.id === id ? { ...e, data: { ...e.data, [`${tipo}Multiplicity`]: valor } } : e);
      const currentEdge = nuevosEdges.find(e => e.id === id);
      const valFrom = (currentEdge.data.fromMultiplicity || '').toLowerCase();
      const valTo = (currentEdge.data.toMultiplicity || '').toLowerCase();
      const isMany = (v) => v.includes('*') || v.includes('n') || v.includes('m') || v.includes('muchos');

      if (isMany(valFrom) && isMany(valTo) && !currentEdge.data.hasAssociativeClass) {
        setTimeout(() => crearTablaIntermedia(currentEdge), 50);
        return nuevosEdges.map(e => e.id === id ? { ...e, data: { ...e.data, hasAssociativeClass: true } } : e);
      }
      return nuevosEdges;
    });
  };

  const perpAngle = angle - Math.PI / 2;
  const offsetX = Math.cos(perpAngle) * 15;
  const offsetY = Math.sin(perpAngle) * 15;

  return (
    <>
      <BaseEdge path={edgePath} style={{ stroke: selected ? '#3b82f6' : '#1f2937', strokeWidth: selected ? 2.5 : 1.5, strokeDasharray: isDashed ? '6,4' : 'none' }} />
      {renderSymbols()}
      <EdgeLabelRenderer>
        {data?.label && type !== 'Clase Asociativa' && (
          <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }} 
                className={`nodrag nopan bg-white px-2 py-0.5 text-[10px] uppercase font-bold border rounded shadow-sm ${selected ? 'border-blue-500 text-blue-600' : 'border-blue-200 text-blue-700'}`}>
            {data.label}
          </div>
        )}
        {showMultiplicity && (
          <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${sourceX + Math.cos(angle)*30 + offsetX}px,${sourceY + Math.sin(angle)*30 + offsetY}px)`, pointerEvents: 'all' }}>
            <input 
              value={data?.fromMultiplicity || ''}
              onChange={(e) => actualizarMultiplicidad('from', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()}
              className="w-12 text-center text-xs font-bold text-gray-800 bg-white/80 hover:bg-white border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none rounded shadow-sm"
              placeholder="1"
            />
          </div>
        )}
        {showMultiplicity && (
          <div style={{ position: 'absolute', transform: `translate(-50%, -50%) translate(${targetX - Math.cos(angle)*30 + offsetX}px,${targetY - Math.sin(angle)*30 + offsetY}px)`, pointerEvents: 'all' }}>
            <input 
              value={data?.toMultiplicity || ''}
              onChange={(e) => actualizarMultiplicidad('to', e.target.value)}
              onMouseDown={(e) => e.stopPropagation()} 
              className="w-12 text-center text-xs font-bold text-gray-800 bg-white/80 hover:bg-white border border-transparent hover:border-gray-400 focus:border-blue-500 focus:outline-none rounded shadow-sm"
              placeholder="0..*"
            />
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { umlClass: UmlClassNode };
const edgeTypes = { umlEdge: CustomUMLEdge, associativeLink: AssociativeLinkEdge };

// ==========================================
// COMPONENTE PRINCIPAL: PIZARRA
// ==========================================
export default function Pizarra() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [mostrarPanelIzquierdo, setMostrarPanelIzquierdo] = useState(true);
  const [mostrarPanelDerecho, setMostrarPanelDerecho] = useState(true);

  const [menuArchivoAbierto, setMenuArchivoAbierto] = useState(false);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null); // NUEVA REF PARA LA CÁMARA
  const [fileHandle, setFileHandle] = useState(null); 

  const [promptIA, setPromptIA] = useState('');
  const [cargandoIA, setCargandoIA] = useState(false);
  const [escuchando, setEscuchando] = useState(false); 
  const recognitionRef = useRef(null);

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  const [cargandoInicial, setCargandoInicial] = useState(true);

  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [relacionActiva, setRelacionActiva] = useState('Asociación');

  const [nodoSeleccionado, setNodoSeleccionado] = useState(null);
  const [aristaSeleccionada, setAristaSeleccionada] = useState(null);

  const socketRef = useRef(null);
  const esActualizacionRemota = useRef(false);

  useEffect(() => {
    if (id === 'individual') {
      setCargandoInicial(false);
      return;
    }

    socketRef.current = io('http://localhost:3000');
    socketRef.current.emit('unirse-pizarra', id);

    const cargarDiagrama = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:3000/api/salas/${id}/diagrama`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.diagrama && data.diagrama.nodes) {
            esActualizacionRemota.current = true; 
            setNodes(data.diagrama.nodes);
            setEdges(data.diagrama.edges || []);
          }
        }
      } catch (error) {
        console.error("Error al cargar diagrama de BD:", error);
      } finally {
        setCargandoInicial(false);
      }
    };

    cargarDiagrama();

    socketRef.current.on('actualizar-pizarra', (diagramaRemoto) => {
      esActualizacionRemota.current = true;
      setNodes(diagramaRemoto.nodes || []);
      setEdges(diagramaRemoto.edges || []);
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [id]);

  useEffect(() => {
    if (id === 'individual' || !socketRef.current || cargandoInicial) return;

    if (esActualizacionRemota.current) {
      esActualizacionRemota.current = false; 
      return;
    }

    const diagramaActual = { nodes, edges };

    socketRef.current.emit('cambio-diagrama', {
      salaId: id,
      diagrama: diagramaActual
    });

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/api/salas/${id}/diagrama`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ diagrama: diagramaActual })
    }).catch(err => console.log(err));

  }, [nodes, edges, id, cargandoInicial]);

  const onNodesChange = useCallback((changes) => setNodes((nds) => applyNodeChanges(changes, nds)), []);
  const onEdgesChange = useCallback((changes) => setEdges((eds) => applyEdgeChanges(changes, eds)), []);

  const onEdgeUpdate = useCallback((oldEdge, newConnection) => {
    setEdges((els) => updateEdge(oldEdge, newConnection, els));
  }, [setEdges]);

  const onConnect = useCallback((params) => {
    const newEdge = { 
      ...params, 
      type: 'umlEdge', 
      data: { 
        label: relacionActiva,
        fromMultiplicity: ['Agregación', 'Composición', 'Asociación'].includes(relacionActiva) ? '1' : '', 
        toMultiplicity: ['Agregación', 'Composición', 'Asociación'].includes(relacionActiva) ? '0..*' : ''
      }
    };
    setEdges((eds) => addEdge(newEdge, eds));
  }, [relacionActiva, setEdges]);

  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault(); 
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const isInterface = type === 'umlInterface';
    
    const newNode = {
      id: `nodo-${Date.now()}`,
      type: 'umlClass',
      position,
      data: { 
        label: isInterface ? '<<interface>>\nNuevaInterfaz' : 'NuevaClase', 
        atributos: ['+ nuevoAtributo: String'], 
        metodos: ['+ nuevoMetodo(): void'] 
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance]);

  const onNodeClick = (_, node) => {
    setNodoSeleccionado(node);
    setAristaSeleccionada(null);
  };

  const onEdgeClick = (_, edge) => {
    setAristaSeleccionada(edge);
    setNodoSeleccionado(null);
  };

  const onPaneClick = () => {
    setNodoSeleccionado(null);
    setAristaSeleccionada(null);
  };

  const actualizarNodo = (idNodo, nuevosDatos) => {
    setNodes(nds => nds.map(n => {
      if (n.id === idNodo) {
        const nodoActualizado = { ...n, data: { ...n.data, ...nuevosDatos } };
        setNodoSeleccionado(nodoActualizado);
        return nodoActualizado;
      }
      return n;
    }));
  };
  
  const eliminarNodoSeleccionado = () => {
    setNodes(nds => nds.filter(n => n.id !== nodoSeleccionado.id));
    setEdges(eds => eds.filter(e => e.source !== nodoSeleccionado.id && e.target !== nodoSeleccionado.id));
    setNodoSeleccionado(null);
  };

  const eliminarAristaSeleccionada = () => {
    setEdges(eds => eds.filter(e => e.id !== aristaSeleccionada.id));
    setAristaSeleccionada(null);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuArchivoAbierto(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNuevoDiagrama = () => {
    if (window.confirm("¿Estás seguro de crear un nuevo diagrama? Se perderán los cambios no guardados.")) {
      setNodes([]);
      setEdges([]);
      setNodoSeleccionado(null);
      setAristaSeleccionada(null);
      setFileHandle(null); 
    }
    setMenuArchivoAbierto(false);
  };

  const handleAbrirClick = async () => {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        setFileHandle(handle); 
        const file = await handle.getFile();
        const text = await file.text();
        const contenido = JSON.parse(text);
        if (contenido.nodes && contenido.edges) {
          setNodes(contenido.nodes);
          setEdges(contenido.edges);
          setNodoSeleccionado(null);
          setAristaSeleccionada(null);
        } else {
          alert("El archivo JSON no tiene un formato válido para este diagrama.");
        }
      } catch (error) {
        console.log("Apertura cancelada");
      }
    } else {
      fileInputRef.current.click();
    }
    setMenuArchivoAbierto(false);
  };

  const handleArchivoSeleccionado = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const contenido = JSON.parse(e.target.result);
        if (contenido.nodes && contenido.edges) {
          setNodes(contenido.nodes);
          setEdges(contenido.edges);
          setNodoSeleccionado(null);
          setAristaSeleccionada(null);
        } else {
          alert("El archivo JSON no tiene un formato válido para este diagrama.");
        }
      } catch (error) {
        alert("Error al leer el archivo. Asegúrate de que sea un archivo JSON válido.");
      }
    };
    reader.readAsText(file);
    event.target.value = null; 
  };

  const handleGuardarDiagrama = async () => {
    const diagramaJSON = JSON.stringify({ nodes, edges }, null, 2);
    
    if (id === 'individual' && window.showSaveFilePicker && fileHandle) {
      try {
        const writable = await fileHandle.createWritable();
        await writable.write(diagramaJSON);
        await writable.close();
      } catch (error) {
        console.error("Error al sobreescribir el archivo", error);
      }
    } else {
      handleGuardarComoDiagrama();
    }
    setMenuArchivoAbierto(false);
  };

  const handleGuardarComoDiagrama = async () => {
    const diagramaJSON = JSON.stringify({ nodes, edges }, null, 2);
    
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: `diagrama_uml_${Date.now()}.json`,
          types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }],
        });
        setFileHandle(handle); 
        const writable = await handle.createWritable();
        await writable.write(diagramaJSON);
        await writable.close();
      } catch (error) {
        console.log("Guardado cancelado");
      }
    } else {
      const blob = new Blob([diagramaJSON], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `diagrama_uml_${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    setMenuArchivoAbierto(false);
  };

  const handleImportarXMI = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xmi,.xml';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append('file', file);

      try {
        const token = localStorage.getItem('token');
        const respuesta = await fetch('http://localhost:3000/api/xmi/importar', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        if (!respuesta.ok) throw new Error('Error al importar el archivo XMI');
        
        const data = await respuesta.json();
        if (data.diagrama && data.diagrama.nodes) {
          setNodes(data.diagrama.nodes);
          setEdges(data.diagrama.edges || []);
        } else {
          alert('El archivo no contiene un diagrama compatible.');
        }
      } catch (err) {
        alert(err.message);
      }
    };
    input.click();
  };
  
  const handleExportarXMI = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:3000/api/xmi/exportar', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodes, edges }) 
      });

      if (!respuesta.ok) throw new Error('Error al exportar a XMI');

      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `diagrama_${Date.now()}.xmi`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportarSpringBoot = async () => {
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch(`http://localhost:3000/api/salas/exportar/spring-local`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ nodes, edges })
      });

      if (!respuesta.ok) throw new Error('Error al generar el proyecto Spring Boot');

      const blob = await respuesta.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proyecto-springboot.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message);
    }
  };
  
  const manejarVoz = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta el reconocimiento de voz.");
      return;
    }
    if (escuchando) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setEscuchando(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = 'es-ES';
    recognition.continuous = true; 
    recognition.interimResults = false;
    
    recognition.onstart = () => setEscuchando(true);
    recognition.onresult = (event) => {
      const current = event.resultIndex;
      const textoDictado = event.results[current][0].transcript;
      setPromptIA((prev) => (prev ? prev + ' ' : '') + textoDictado);
    };
    recognition.onerror = () => setEscuchando(false);
    recognition.onend = () => setEscuchando(false);
    recognition.start();
  };

  const manejarGeneracionIA = async () => {
    if (!promptIA.trim()) return; 
    setCargandoIA(true);
    try {
      const token = localStorage.getItem('token');
      const respuesta = await fetch('http://localhost:3000/api/ia/generar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptIA }) 
      });

      if (!respuesta.ok) throw new Error('Error en el servidor');
      const data = await respuesta.json();
      
      if (data.diagrama && data.diagrama.clases) {
        const offsetY = nodes.length > 0 ? (nodes.length * 40) : 0; 
        const batchId = Date.now(); 
        const nuevosNodos = data.diagrama.clases.map((clase, index) => ({
          id: `${clase.nombre}_${batchId}`,
          type: 'umlClass',
          position: { x: 200 + (index * 250), y: 100 + offsetY + (index * 150) }, 
          data: { label: clase.nombre, atributos: clase.atributos, metodos: clase.metodos }
        }));

        const nuevasRelaciones = data.diagrama.relaciones ? data.diagrama.relaciones.map((rel, index) => {
          const typeLower = rel.type.toLowerCase();
          let etiquetaEspanol = 'Asociación';

          if (typeLower.includes('dependency')) etiquetaEspanol = 'Dependencia';
          else if (typeLower.includes('inheritance') || typeLower.includes('generalization')) etiquetaEspanol = 'Generalización';
          else if (typeLower.includes('realization')) etiquetaEspanol = 'Realización';
          else if (typeLower.includes('aggregation')) etiquetaEspanol = 'Agregación';
          else if (typeLower.includes('composition')) etiquetaEspanol = 'Composición';

          return {
            id: `edge-${rel.from}-${rel.to}-${index}-${batchId}`,
            source: `${rel.from}_${batchId}`, 
            target: `${rel.to}_${batchId}`,
            type: 'umlEdge', 
            data: { 
              label: etiquetaEspanol,
              fromMultiplicity: rel.fromMultiplicity || '', 
              toMultiplicity: rel.toMultiplicity || ''
            }
          };
        }) : [];

        setNodes((nds) => [...nds, ...nuevosNodos]);
        setEdges((eds) => [...eds, ...nuevasRelaciones]);
      }
      setPromptIA(''); 
    } catch (error) {
      console.error(error);
      alert("Hubo un problema de conexión con la IA.");
    } finally {
      setCargandoIA(false);
    }
  };

  // ==========================================
  // MANEJADOR DE IMÁGENES PARA LA IA
  // ==========================================
  const manejarGeneracionIAImagen = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setCargandoIA(true);
    const formData = new FormData();
    // CORRECCIÓN: Usamos 'imagen' para coincidir con el upload.single('imagen') del backend
    formData.append('imagen', file);

    try {
      const token = localStorage.getItem('token');
      // La URL ahora coincide con aiRoutes.js
      const respuesta = await fetch('http://localhost:3000/api/ia/generar-imagen', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!respuesta.ok) throw new Error('Error en el servidor al procesar la imagen');
      const data = await respuesta.json();

      if (data.diagrama && data.diagrama.clases) {
        const offsetY = nodes.length > 0 ? (nodes.length * 40) : 0; 
        const batchId = Date.now(); 
        const nuevosNodos = data.diagrama.clases.map((clase, index) => ({
          id: `${clase.nombre}_${batchId}`,
          type: 'umlClass',
          position: { x: 200 + (index * 250), y: 100 + offsetY + (index * 150) }, 
          data: { label: clase.nombre, atributos: clase.atributos, metodos: clase.metodos }
        }));

        const nuevasRelaciones = data.diagrama.relaciones ? data.diagrama.relaciones.map((rel, index) => {
          const typeLower = rel.type.toLowerCase();
          let etiquetaEspanol = 'Asociación';

          if (typeLower.includes('dependency')) etiquetaEspanol = 'Dependencia';
          else if (typeLower.includes('inheritance') || typeLower.includes('generalization')) etiquetaEspanol = 'Generalización';
          else if (typeLower.includes('realization')) etiquetaEspanol = 'Realización';
          else if (typeLower.includes('aggregation')) etiquetaEspanol = 'Agregación';
          else if (typeLower.includes('composition')) etiquetaEspanol = 'Composición';

          return {
            id: `edge-${rel.from}-${rel.to}-${index}-${batchId}`,
            source: `${rel.from}_${batchId}`, 
            target: `${rel.to}_${batchId}`,
            type: 'umlEdge', 
            data: { 
              label: etiquetaEspanol,
              fromMultiplicity: rel.fromMultiplicity || '', 
              toMultiplicity: rel.toMultiplicity || ''
            }
          };
        }) : [];

        setNodes((nds) => [...nds, ...nuevosNodos]);
        setEdges((eds) => [...eds, ...nuevasRelaciones]);
      }
    } catch (error) {
      console.error(error);
      alert("Hubo un problema al procesar la imagen con la IA. Intenta con una foto más clara.");
    } finally {
      setCargandoIA(false);
      event.target.value = null; // Reseteamos el input para permitir subir la misma foto otra vez
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden text-sm font-sans">
      <header className="bg-[#1e293b] text-white flex items-center px-4 py-2 justify-between shrink-0 shadow-md relative z-20">
        <div className="flex items-center gap-2 md:gap-4">
          <button onClick={() => navigate('/salas')} className="hover:text-emerald-400 transition-colors flex items-center gap-1 text-sm font-medium"><ArrowLeft className="w-4 h-4" /> Volver</button>
          <span className="text-gray-500 font-light">|</span>
          <span className="font-bold tracking-wider text-emerald-400 whitespace-nowrap">{id === 'individual' ? 'Modo Individual' : `Sala Colaborativa: ${id}`}</span>
          <span className="text-gray-500 font-light">|</span>

          <nav className="flex items-center gap-0.5 text-sm" ref={menuRef}>
            <div className="relative">
              <button onClick={() => setMenuArchivoAbierto(!menuArchivoAbierto)} className={`px-3 py-1.5 rounded transition-colors ${menuArchivoAbierto ? 'bg-emerald-700' : 'hover:bg-slate-700'}`}>Archivo</button>
              {menuArchivoAbierto && (
                <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 shadow-xl rounded-md py-1 text-gray-800 z-50 font-normal">
                  <button onClick={handleNuevoDiagrama} className="w-full text-left px-4 py-1.5 hover:bg-gray-100 transition-colors">Nuevo...</button>
                  <button onClick={handleAbrirClick} className="w-full text-left px-4 py-1.5 hover:bg-gray-100 transition-colors">Abrir...</button>
                  <div className="border-t border-gray-200 my-1"></div>
                  <button onClick={handleGuardarDiagrama} className="w-full text-left px-4 py-1.5 hover:bg-emerald-50 text-emerald-900 font-semibold flex justify-between items-center transition-colors"><span>Guardar</span><span className="text-xs text-gray-500 font-normal">Ctrl+S</span></button>
                  <button onClick={handleGuardarComoDiagrama} className="w-full text-left px-4 py-1.5 hover:bg-gray-100 flex justify-between items-center transition-colors"><span>Guardar como</span><span className="text-xs text-gray-500 font-normal">Ctrl+Shift+S</span></button>
                </div>
              )}
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleArchivoSeleccionado} style={{ display: 'none' }} accept=".json" />
            
            <div className="flex items-center gap-2 ml-4">
              
              <div className="flex bg-slate-800 rounded-md p-0.5 border border-slate-700 mr-2">
                <button onClick={() => setMostrarPanelIzquierdo(!mostrarPanelIzquierdo)} className={`p-1.5 rounded transition-colors ${mostrarPanelIzquierdo ? 'text-emerald-400 bg-slate-700' : 'text-gray-400 hover:text-white'}`} title="Panel Izquierdo">
                  {mostrarPanelIzquierdo ? <PanelLeftClose className="w-4 h-4"/> : <PanelLeftOpen className="w-4 h-4"/>}
                </button>
                <button onClick={() => setMostrarPanelDerecho(!mostrarPanelDerecho)} className={`p-1.5 rounded transition-colors ${mostrarPanelDerecho ? 'text-emerald-400 bg-slate-700' : 'text-gray-400 hover:text-white'}`} title="Panel Derecho">
                  {mostrarPanelDerecho ? <PanelRightClose className="w-4 h-4"/> : <PanelRightOpen className="w-4 h-4"/>}
                </button>
              </div>
              
              
              <button onClick={handleImportarXMI} className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shadow border border-slate-600">
                <Upload className="w-3.5 h-3.5" /> Importar XMI
              </button>
              
              <button onClick={handleExportarXMI} className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shadow border border-slate-600">
                <Download className="w-3.5 h-3.5" /> Exportar XMI
              </button>
              

              <button onClick={handleExportarSpringBoot} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-2 shadow border border-emerald-500 ml-2">
                <Code className="w-3.5 h-3.5" /> Exportar S_B
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {mostrarPanelIzquierdo && (
          <aside className="w-64 bg-white border-r border-gray-300 flex flex-col shrink-0 overflow-y-auto z-10 shadow-sm animate-in slide-in-from-left duration-200">
             <div className="bg-emerald-800 text-white font-semibold p-2.5 text-xs flex items-center justify-between cursor-pointer"><span>UML 2.5 o superior</span><ChevronDown className="w-4 h-4" /></div>
            <div className="p-4 grid grid-cols-2 gap-4 bg-white border-b border-gray-200">
              <div onDragStart={(e) => onDragStart(e, 'umlClass')} draggable className="border border-gray-400 h-14 flex flex-col cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors shadow-sm bg-white">
                <div className="bg-blue-50 h-5 border-b border-gray-400 font-bold text-[9px] flex items-center justify-center text-black">Classname</div>
                <div className="flex-1 border-b border-gray-400"></div><div className="flex-1"></div>
              </div>
              <div onDragStart={(e) => onDragStart(e, 'umlInterface')} draggable className="border border-gray-400 h-14 flex flex-col cursor-grab active:cursor-grabbing hover:bg-blue-50 transition-colors shadow-sm bg-white">
                <div className="bg-blue-50 h-6 border-b border-gray-400 text-[8px] flex flex-col items-center justify-center text-black leading-none">
                  <span className="italic">{"<<interface>>"}</span><span className="font-bold text-[9px] mt-0.5">Interface</span>
                </div>
                <div className="flex-1 border-b border-gray-400"></div><div className="flex-1"></div>
              </div>
            </div>
            <div className="bg-emerald-800 text-white font-semibold p-2.5 text-xs flex items-center justify-between cursor-pointer"><span>Relaciones</span><ChevronDown className="w-4 h-4" /></div>
            <div className="p-3 bg-white flex flex-col gap-1 overflow-y-auto pb-6">
              <button onClick={() => setRelacionActiva('Asociación')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Asociación' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><line x1="0" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="1.5" /></svg> Asociación
              </button>
              <button onClick={() => setRelacionActiva('Dependencia')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Dependencia' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><line x1="0" y1="6" x2="36" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" /><polyline points="32,2 38,6 32,10" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg> Dependencia
              </button>
              <button onClick={() => setRelacionActiva('Generalización')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Generalización' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><line x1="0" y1="6" x2="32" y2="6" stroke="currentColor" strokeWidth="1.5" /><polygon points="32,2 40,6 32,10" fill="white" stroke="currentColor" strokeWidth="1.5" /></svg> Generalización
              </button>
              <button onClick={() => setRelacionActiva('Realización')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Realización' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><line x1="0" y1="6" x2="32" y2="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" /><polygon points="32,2 40,6 32,10" fill="white" stroke="currentColor" strokeWidth="1.5" /></svg> Realización
              </button>
              <button onClick={() => setRelacionActiva('Agregación')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Agregación' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><polygon points="0,6 6,2 12,6 6,10" fill="white" stroke="currentColor" strokeWidth="1.5" /><line x1="12" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="1.5" /></svg> Agregación
              </button>
              <button onClick={() => setRelacionActiva('Composición')} className={`flex items-center gap-4 p-2.5 rounded transition-colors text-left text-sm font-medium ${relacionActiva === 'Composición' ? 'bg-blue-100 text-blue-800 ring-1 ring-blue-400' : 'text-gray-800 hover:bg-gray-100'}`}>
                <svg width="40" height="12" viewBox="0 0 40 12" className="overflow-visible"><polygon points="0,6 6,2 12,6 6,10" fill="currentColor" stroke="currentColor" strokeWidth="1.5" /><line x1="12" y1="6" x2="40" y2="6" stroke="currentColor" strokeWidth="1.5" /></svg> Composición
              </button>
            </div>
          </aside>
        )}

        <section className="flex-1 bg-white relative overflow-hidden z-0" ref={reactFlowWrapper}>
          <ReactFlow 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange}
            onConnect={onConnect} 
            onEdgeUpdate={onEdgeUpdate} 
            onInit={setReactFlowInstance}
            onDrop={onDrop} 
            onDragOver={onDragOver}
            onNodeClick={onNodeClick} 
            onEdgeClick={onEdgeClick} 
            onPaneClick={onPaneClick} 
            nodeTypes={nodeTypes} 
            edgeTypes={edgeTypes} 
            panOnScroll={true} 
            selectionOnDrag={true} 
            fitView
          >
            <Background color="#d1d5db" gap={20} size={1} />
            <Controls />
            <MiniMap nodeColor="#1e293b" maskColor="rgba(200, 200, 200, 0.4)" className="border-2 border-gray-300 shadow-lg rounded-md overflow-hidden" style={{ width: 150, height: 100 }} />
          </ReactFlow>

          {nodes.length === 0 && !cargandoInicial && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 font-medium text-center pointer-events-none">
              <p className="text-2xl mb-2 text-gray-300">Lienzo vacío</p>
              <p className="text-sm">Arrastra una clase desde la izquierda o genera con IA</p>
            </div>
          )}
        </section>

        {mostrarPanelDerecho && (
          <aside className="w-[320px] bg-white border-l border-gray-300 flex flex-col shrink-0 z-10 shadow-sm relative animate-in slide-in-from-right duration-200">
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <h3 className="font-bold text-gray-800 text-sm mb-4 border-b border-gray-200 pb-2">Propiedades</h3>
              
              {nodoSeleccionado ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre de Clase</label>
                    <input 
                      type="text" 
                      value={nodoSeleccionado.data.label}
                      onChange={(e) => actualizarNodo(nodoSeleccionado.id, { label: e.target.value })}
                      className="w-full border border-gray-300 rounded p-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-500">Atributos</label>
                      <button onClick={() => actualizarNodo(nodoSeleccionado.id, { atributos: [...(nodoSeleccionado.data.atributos || []), '+ nuevoAtributo: String'] })} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(nodoSeleccionado.data.atributos || []).map((attr, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={attr}
                            onChange={(e) => {
                              const arr = [...nodoSeleccionado.data.atributos];
                              arr[index] = e.target.value;
                              actualizarNodo(nodoSeleccionado.id, { atributos: arr });
                            }}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:border-blue-500 outline-none"
                          />
                          <button 
                            onClick={() => {
                              const arr = nodoSeleccionado.data.atributos.filter((_, i) => i !== index);
                              actualizarNodo(nodoSeleccionado.id, { atributos: arr });
                            }}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-semibold text-gray-500">Métodos</label>
                      <button onClick={() => actualizarNodo(nodoSeleccionado.id, { metodos: [...(nodoSeleccionado.data.metodos || []), '+ nuevoMetodo(): void'] })} className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {(nodoSeleccionado.data.metodos || []).map((met, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={met}
                            onChange={(e) => {
                              const arr = [...nodoSeleccionado.data.metodos];
                              arr[index] = e.target.value;
                              actualizarNodo(nodoSeleccionado.id, { metodos: arr });
                            }}
                            className="flex-1 border border-gray-300 rounded px-2 py-1 text-xs font-mono focus:border-blue-500 outline-none"
                          />
                          <button 
                            onClick={() => {
                              const arr = nodoSeleccionado.data.metodos.filter((_, i) => i !== index);
                              actualizarNodo(nodoSeleccionado.id, { metodos: arr });
                            }}
                            className="text-red-500 hover:bg-red-50 p-1 rounded"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button onClick={eliminarNodoSeleccionado} className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors font-medium text-xs">
                    <Trash2 className="w-4 h-4" /> Eliminar Clase
                  </button>
                </div>

              ) : aristaSeleccionada ? (
                <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                  <div className="bg-blue-50 text-blue-800 p-3 rounded border border-blue-200 text-center font-bold text-xs uppercase">
                    {aristaSeleccionada.data?.label || 'Relación'}
                  </div>
                  <p className="text-xs text-gray-500 text-center">Para editar las multiplicidades, haz clic directamente en los números sobre la línea en el lienzo.</p>
                  
                  <button onClick={eliminarAristaSeleccionada} className="mt-4 flex items-center justify-center gap-2 w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded hover:bg-red-100 transition-colors font-medium text-xs">
                    <Trash2 className="w-4 h-4" /> Eliminar Relación
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center flex-col text-center px-6 opacity-60">
                  <div className="w-12 h-12 border-2 border-dashed border-gray-400 rounded-lg mb-3 flex items-center justify-center"><span className="block w-6 h-1 bg-gray-400"></span></div>
                  <p className="text-xs text-gray-500">Selecciona una clase o relación en el lienzo para editar sus atributos, métodos o eliminarla.</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-400"></div>
                <h3 className="font-bold text-gray-800 text-sm">Asistente de IA</h3>
              </div>
              
              <textarea 
                value={promptIA}
                onChange={(e) => setPromptIA(e.target.value)}
                className="w-full h-[120px] border border-gray-300 rounded-lg p-3 resize-none focus:border-orange-400 outline-none mb-3 bg-white text-sm text-gray-600 placeholder:text-gray-400"
                placeholder="Ej: Crea una clase Empresa y una clase Empleado. Un empleado trabaja en una empresa."
              ></textarea>

              {/* INPUT INVISIBLE PARA LA CÁMARA */}
              <input 
                type="file" 
                ref={cameraInputRef} 
                accept="image/*" 
                capture="environment" 
                style={{ display: 'none' }} 
                onChange={manejarGeneracionIAImagen} 
              />

              <div className="flex gap-2">
                <button 
                  onClick={manejarVoz}
                  title="Dictar por voz"
                  className={`w-10 h-10 border rounded flex items-center justify-center transition-colors ${
                    escuchando ? 'bg-red-100 border-red-400 text-red-600 animate-pulse' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                
                {/* BOTÓN VINCULADO AL INPUT DE LA CÁMARA */}
                <button 
                  onClick={() => cameraInputRef.current.click()}
                  className="w-10 h-10 bg-white border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100 text-gray-600 transition-colors"
                  title="Subir foto o usar cámara"
                >
                  <Camera className="w-5 h-5" />
                </button>

                <button 
                  onClick={manejarGeneracionIA}
                  disabled={cargandoIA || (!promptIA.trim() && !cameraInputRef.current?.files?.length)}
                  className={`flex-1 text-white rounded flex items-center justify-center gap-2 font-bold transition-colors ${cargandoIA ? 'bg-orange-300 cursor-not-allowed' : 'bg-[#ffb067] hover:bg-orange-400'}`}
                >
                  <Send className="w-4 h-4" /> 
                  {cargandoIA ? 'Generando...' : 'Generar'}
                </button>
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}