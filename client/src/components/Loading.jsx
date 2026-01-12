import React from 'react';
import { Oval } from 'react-loader-spinner';

export default function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f0f0f0' }}>
      <Oval
      visible={true}
      height="80"
      width="80"
      color="#7A68D3"
      secondaryColor="#6C58CE"
      ariaLabel="oval-loading"
      wrapperStyle={{}}
      wrapperClass=""
      />
    </div>
  );
};

