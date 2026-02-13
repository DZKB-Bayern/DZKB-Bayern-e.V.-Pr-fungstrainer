
import React from 'react';

interface LoaderProps {
  message?: string;
}

const Loader: React.FC<LoaderProps> = ({ message = "Wird geladen..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-xl">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-[#0B79D0] rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-700 font-semibold">{message}</p>
    </div>
  );
};

export default Loader;
