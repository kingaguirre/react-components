import styled from 'styled-components';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
  margin: 0 auto;
`;

export const ChatWindow = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  height: 300px;
  overflow-y: auto;
  background: #fafafa;
`;

export const Bubble = styled.div<{ fromUser: boolean }>`
  background: ${({ fromUser }) => (fromUser ? '#cce5ff' : '#e2e3e5')};
  color: #333;
  padding: 8px 12px;
  border-radius: 16px;
  max-width: 70%;
  align-self: ${({ fromUser }) => (fromUser ? 'flex-end' : 'flex-start')};
  margin: 4px 0;
`;

export const InputRow = styled.div`
  display: flex;
  gap: 8px;
`;

export const TextInput = styled.input`
  flex: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

export const SendButton = styled.button`
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

export const JsonContainer = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  max-height: 400px;
  overflow: auto;
`;

export const RawJsonArea = styled.textarea`
  width: 100%;
  height: 200px;
  margin-top: 8px;
  padding: 8px;
  font-family: monospace;
  font-size: 0.9rem;
`;

export const CopyButton = styled.button`
  margin-top: 4px;
  padding: 4px 8px;
  background: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;
