import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FighterInitialization } from '../components/FighterInitialization';
import { useFighter } from '../context/FighterContext';
import { useAuth } from '../context/AuthContext';

export const CreateFighter: React.FC = () => {
  const { user } = useAuth();
  const { reloadFighter } = useFighter();
  const navigate = useNavigate();

  const handleComplete = async (_fighterName: string) => {
    await reloadFighter();
    navigate('/', { replace: true });
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black">
      <FighterInitialization userId={user.id} onComplete={handleComplete} />
    </div>
  );
};
