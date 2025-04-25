import './Loading.css';  

export default function Loading({ children }) {
  return (
    <div className="loading">
      {children || 'Loading…'}
    </div>
  );
}
