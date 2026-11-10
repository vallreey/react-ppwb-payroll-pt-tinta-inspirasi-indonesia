import { Link } from 'react-router-dom';

const VARIANTS = {
  primary: 'bg-gradient-to-r from-cyan-500 to-indigo-700 text-white shadow-card hover:opacity-90',
  blue: 'bg-blue-600 text-white hover:bg-blue-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  danger: 'border border-red-300 bg-white text-red-700 hover:bg-red-50',
  success: 'border border-green-300 bg-white text-green-700 hover:bg-green-50',
};

export default function Button({ variant = 'primary', to, className = '', children, type = 'button', ...rest }) {
  const classes = `inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTS[variant]} ${className}`;
  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
