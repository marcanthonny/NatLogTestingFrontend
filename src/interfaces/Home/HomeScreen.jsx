import React from 'react';
import './HomeScreen.css';

const HomeScreen = () => {
  return (
    <div className="home-container">
      <div className="map-container">
        {/* Using a placeholder div for the map - you'll need to add actual map implementation */}
        <div className="indonesia-map">
          {/* Add your map implementation here */}
          {/* You can use libraries like react-simple-maps or an SVG map */}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
