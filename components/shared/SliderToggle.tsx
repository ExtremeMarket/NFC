import React from 'react';

interface SliderToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const SliderToggle: React.FC<SliderToggleProps> = ({ checked, onChange, disabled = false }) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <div
      onClick={handleToggle}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out ${
        disabled ? 'cursor-not-allowed opacity-50' : 'bg-gray-500'
      } ${checked ? 'bg-teal-500' : 'bg-gray-600'} ${disabled ? '' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </div>
  );
};

export default SliderToggle;