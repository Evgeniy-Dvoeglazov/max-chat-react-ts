import './ErrorText.css';

interface ErrorTextProps {
  children: string;
}

export function ErrorText({ children }: ErrorTextProps) {
  return <p className='errorText'>{children}</p>;
}
