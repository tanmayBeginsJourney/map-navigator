import React from 'react';

const HomePage: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center', 
      maxWidth: '800px', 
      margin: '0 auto' 
    }}>
      <h1>Campus Navigation System</h1>
      <p>Welcome to the Campus Indoor-Outdoor Navigation System!</p>
      <div style={{ marginTop: '2rem', color: '#666' }}>
        <p>📍 Find your way around campus with ease</p>
        <p>🗺️ Navigate between buildings and floors</p>
        <p>🎯 Get step-by-step directions to any location</p>
      </div>
      <div style={{ 
        marginTop: '3rem', 
        padding: '1rem', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <p>🚧 Frontend development in progress...</p>
        <p>Phase 1: Core Frontend Setup - Task 9 Complete</p>
      </div>
    </div>
  );
};

export default HomePage; 