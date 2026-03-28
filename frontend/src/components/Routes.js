import React, { useState } from 'react';
import './components.css';

const RoutesList = () => {
  const [routes, setRoutes] = useState([
    {
      id: '1',
      name: 'Rota Zona Norte',
      date: '2026-03-01',
      points: 5,
      distance: 45.2,
      waste: 1200,
      status: 'PLANNED'
    },
    {
      id: '2',
      name: 'Rota Centro',
      date: '2026-03-01',
      points: 8,
      distance: 32.5,
      waste: 2450,
      status: 'COMPLETED'
    }
  ]);

  // Estados para modais
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    points: '',
    distance: '',
    waste: '',
    status: ''
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'PLANNED': return '#ff9800';
      case 'IN_PROGRESS': return '#2196F3';
      case 'COMPLETED': return '#4CAF50';
      default: return '#999';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'PLANNED': return 'Planejada';
      case 'IN_PROGRESS': return 'Em Andamento';
      case 'COMPLETED': return 'Concluída';
      default: return status;
    }
  };

  // ========== FUNÇÃO VER DETALHES ==========
  const handleViewDetails = (route) => {
    setSelectedRoute(route);
    setShowDetailsModal(true);
  };

  // ========== FUNÇÃO ABRIR EDITAR ==========
  const handleEdit = (route) => {
    setSelectedRoute(route);
    setEditFormData({
      name: route.name,
      points: route.points,
      distance: route.distance,
      waste: route.waste,
      status: route.status
    });
    setShowEditModal(true);
  };

  // ========== FUNÇÃO SALVAR EDIÇÃO ==========
  const handleSaveEdit = () => {
    const updatedRoutes = routes.map(route => 
      route.id === selectedRoute.id 
        ? { 
            ...route, 
            name: editFormData.name,
            points: editFormData.points,
            distance: editFormData.distance,
            waste: editFormData.waste,
            status: editFormData.status
          } 
        : route
    );
    setRoutes(updatedRoutes);
    setShowEditModal(false);
    setSelectedRoute(null);
  };

  return (
    <div className="routes-container">
      <div className="routes-header">
        <h2>Rotas Otimizadas</h2>
        <button className="btn-primary">
          <i className="fas fa-plus"></i> Nova Rota
        </button>
      </div>

      {routes.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">
            <i className="fas fa-route"></i>
          </div>
          <h3>Nenhuma rota cadastrada</h3>
          <p>Clique em "Nova Rota" para começar</p>
        </div>
      ) : (
        <div className="routes-grid">
          {routes.map(route => (
            <div key={route.id} className="route-card">
              <div className="route-header">
                <h3>{route.name}</h3>
                <span 
                  className="status-badge"
                  style={{ 
                    backgroundColor: getStatusColor(route.status) + '20', 
                    color: getStatusColor(route.status) 
                  }}
                >
                  {getStatusText(route.status)}
                </span>
              </div>
              
              <div className="route-stats">
                <div className="route-stat">
                  <i className="fas fa-calendar"></i>
                  <span>{new Date(route.date).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="route-stat">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{route.points} pontos</span>
                </div>
                <div className="route-stat">
                  <i className="fas fa-road"></i>
                  <span>{route.distance} km</span>
                </div>
                <div className="route-stat">
                  <i className="fas fa-weight-hanging"></i>
                  <span>{route.waste} kg</span>
                </div>
              </div>

              <div className="route-footer">
                <button 
                  className="btn-view"
                  onClick={() => handleViewDetails(route)}
                >
                  <i className="fas fa-eye"></i> Ver Detalhes
                </button>
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(route)}
                >
                  <i className="fas fa-edit"></i> Editar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========== MODAL DE DETALHES ========== */}
      {showDetailsModal && selectedRoute && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detalhes da Rota</h2>
              <button className="close" onClick={() => setShowDetailsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="details-section">
                <h3>Informações Gerais</h3>
                <p><strong>Nome:</strong> {selectedRoute.name}</p>
                <p><strong>Data:</strong> {new Date(selectedRoute.date).toLocaleDateString('pt-BR')}</p>
                <p><strong>Status:</strong> {getStatusText(selectedRoute.status)}</p>
              </div>

              <div className="details-section">
                <h3>Métricas</h3>
                <p><strong>Pontos de Coleta:</strong> {selectedRoute.points}</p>
                <p><strong>Distância Total:</strong> {selectedRoute.distance} km</p>
                <p><strong>Volume Coletado:</strong> {selectedRoute.waste} kg</p>
              </div>

              <div className="details-section">
                <h3>Estimativa de Impacto</h3>
                <p><strong>CO₂ Economizado:</strong> {Math.round(selectedRoute.waste * 0.13)} kg</p>
                <p><strong>Água Economizada:</strong> {selectedRoute.waste * 5} L</p>
                <p><strong>Combustível Economizado:</strong> {Math.round(selectedRoute.distance * 0.35)} L</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ========== MODAL DE EDIÇÃO ========== */}
      {showEditModal && selectedRoute && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Rota</h2>
              <button className="close" onClick={() => setShowEditModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nome da Rota</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="Ex: Rota Zona Norte"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Pontos de Coleta</label>
                  <input
                    type="number"
                    value={editFormData.points}
                    onChange={(e) => setEditFormData({...editFormData, points: parseInt(e.target.value)})}
                  />
                </div>

                <div className="form-group">
                  <label>Distância (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editFormData.distance}
                    onChange={(e) => setEditFormData({...editFormData, distance: parseFloat(e.target.value)})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Volume Coletado (kg)</label>
                  <input
                    type="number"
                    value={editFormData.waste}
                    onChange={(e) => setEditFormData({...editFormData, waste: parseInt(e.target.value)})}
                  />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                  >
                    <option value="PLANNED">Planejada</option>
                    <option value="IN_PROGRESS">Em Andamento</option>
                    <option value="COMPLETED">Concluída</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditModal(false)}>Cancelar</button>
              <button className="btn-primary" onClick={handleSaveEdit}>Salvar Alterações</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutesList;