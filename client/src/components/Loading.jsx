import { Loader2 } from 'lucide-react';

const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary-600 mb-4" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
