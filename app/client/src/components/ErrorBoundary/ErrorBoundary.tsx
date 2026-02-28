import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.href = '/channels';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="size-10 text-destructive" />
                </div>
              </div>
              <CardTitle className="text-2xl">Oops! Something went wrong</CardTitle>
              <CardDescription>
                We're sorry, but an unexpected error occurred. Please try refreshing the page or returning to the home screen.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="size-4" />
                <AlertTitle>Error Details</AlertTitle>
                <AlertDescription>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </AlertDescription>
              </Alert>
              
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium text-muted-foreground hover:text-foreground mb-2">
                    Stack Trace (Development Only)
                  </summary>
                  <pre className="overflow-auto p-3 rounded-md bg-muted text-muted-foreground max-h-48 text-[10px]">
                    {this.state.error?.stack}
                    {'\n\n'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full sm:w-auto"
              >
                <RefreshCw className="size-4 mr-2" />
                Reload Page
              </Button>
              <Button 
                onClick={this.handleReset}
                className="w-full sm:w-auto"
              >
                <Home className="size-4 mr-2" />
                Go to Channels
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
