import { ReactNode, Component, ErrorInfo } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-h-screen bg-iron-dark p-6 flex items-center justify-center"
        >
          <motion.div
            initial={{ y: 20 }}
            animate={{ y: 0 }}
            className="bg-iron-mid border-2 border-red-800/50 rounded-lg p-8 max-w-md text-center"
          >
            <AlertTriangle
              size={48}
              className="mx-auto mb-4 text-red-400"
            />
            <h1 className="text-2xl font-bold text-red-400 mb-2">
              Something Went Wrong
            </h1>
            <p className="text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred. This may be due to corrupted user data.'}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={this.handleReset}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-800 text-white rounded-lg hover:bg-red-800/80 transition font-semibold"
            >
              <RefreshCw size={18} />
              Reload Page
            </motion.button>
            <p className="text-xs text-gray-500 mt-4">
              ℹ️ If the problem persists, please contact the admin.
            </p>
          </motion.div>
        </motion.div>
      );
    }

    return this.props.children || this.props.fallback;
  }
}
