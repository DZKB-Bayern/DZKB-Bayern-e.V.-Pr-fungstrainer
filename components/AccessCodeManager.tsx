
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllAccessCodes, createAccessCode, updateAccessCode, deleteAccessCode } from '../services/supabaseService';
import { AccessCode } from '../types';
import ToggleSwitch from './ToggleSwitch';
import KeyIcon from './icons/KeyIcon';
import ClipboardIcon from './icons/ClipboardIcon';
import CheckIcon from './icons/CheckIcon';

const ADJECTIVES = [
  'BRAV',
  'FRECH',
  'FRÖHLICH',
  'VERSPIELT',
  'TREU',
  'CHARMANT',
  'CLEVER',
  'MUTIG',
  'LIEB',
  'TAPFER',
  'NEUGIERIG',
  'GLÜCKLICH',
  'FLAUSCHIG',
  'WACH',
  'ENTSPANNT',
  'SOUVERÄN',
  'ZUVERLÄSSIG',
  'LERNFREUDIG',
];

const NOUNS = [
  'PFOTE',
  'FELLNASE',
  'WUFF',
  'WELPE',
  'SCHNAUZE',
  'LECKERLI',
  'KNOCHEN',
  'SPIELZEUG',
  'APPORT',
  'TRAIL',
  'DUMMY',
  'HUNDEWIESE',
  'GRUPPE',
  'TRAINING',
  'CLICKER',
  'LEINE',
  'HALSBAND',
];

const generateReadableCode = (): string => {
  const randomAdj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const randomNoun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const randomNumber = Math.floor(100 + Math.random() * 900);
  return `${randomAdj}-${randomNoun}-${randomNumber}`;
};

const AccessCodeManager: React.FC = () => {
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCodes = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await fetchAllAccessCodes();
    if (error) {
      setError(error.message);
    } else {
      setCodes(data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadCodes();
  }, [loadCodes]);

  const handleCreateCode = async () => {
    if (!newCodeName.trim()) return;
    const code = generateReadableCode();
    const { error } = await createAccessCode(code, newCodeName.trim());
    if (!error) {
      setNewCodeName('');
      loadCodes();
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    const { error } = await updateAccessCode(id, { is_active: !isActive });
    if (!error) {
      setCodes(prev =>
        prev.map(code =>
          code.id === id ? { ...code, is_active: !isActive } : code
        )
      );
    }
  };

  const handleDeleteCode = async (id: number) => {
    if (!window.confirm('Zugangscode wirklich löschen?')) return;
    const { error } = await deleteAccessCode(id);
    if (!error) {
      setCodes(prev => prev.filter(code => code.id !== id));
    }
  };

  const handleCopyCode = async (code: string, id: number) => {
    await navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 1500);
  };

  return (
    <div>
      {/* UI unverändert */}
    </div>
  );
};

export default AccessCodeManager;
