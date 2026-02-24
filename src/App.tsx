/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sword, 
  Brain, 
  Coins, 
  Shield, 
  Users, 
  Skull, 
  Volume2, 
  VolumeX,
  ChevronRight,
  RefreshCw,
  Clock,
  MapPin,
  Crown,
  Type as TypeIcon,
  Palette,
  AlertTriangle,
  Anchor,
  Sun,
  CloudRain,
  Wind,
  Zap,
  Backpack,
  Clover,
  Hourglass
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { LINEAGES } from './constants';
import { GameState, Lineage, Choice, Attribute, NPC, ThemeType } from './types';
import { generateInitialStory, getGameOutcome, speakText, generateImage } from './services/gemini';

export default function App() {
  const [screen, setScreen] = useState<'start' | 'selection' | 'game' | 'death'>('start');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [theme, setTheme] = useState<ThemeType>('parchment');
  const [fontSize, setFontSize] = useState<number>(18);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = async (text: string) => {
    if (isMuted) return;
    const url = await speakText(text);
    if (url) {
      setAudioUrl(url);
    }
  };

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.play();
    }
  }, [audioUrl]);

  const handleStart = () => {
    setScreen('selection');
  };

  const handleSelectLineage = async (lineage: typeof LINEAGES[0]) => {
    setLoading(true);
    try {
      const { story, imagePrompt } = await generateInitialStory(lineage.name, lineage.initialChallenge);
      const imageUrl = await generateImage(imagePrompt);
      
      const initialState: GameState = {
        player: {
          name: lineage.name.split(" (")[0],
          age: 8,
          attributes: { ...lineage.initialAttributes },
          lineageId: lineage.id,
          kingdom: lineage.kingdom,
          inventory: ["Roupas simples"],
          luck: 50,
          currency: { ...lineage.initialCurrency }
        },
        npcs: lineage.linkedNPCs.map(npc => ({ ...npc })),
        day: 1,
        season: "Primavera",
        weather: "Ensolarado",
        currentStory: story,
        currentImageUrl: imageUrl || undefined,
        choices: [
          { text: "Explorar os arredores", consequenceHint: "Pode encontrar algo útil" },
          { text: "Falar com sua família", consequenceHint: "Melhora relacionamentos" },
          { text: "Descansar", consequenceHint: "Recupera saúde" }
        ],
        isGameOver: false
      };
      setGameState(initialState);
      setScreen('game');
      playAudio(story);
    } catch (error) {
      console.error("Error starting game:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChoice = async (choice: Choice) => {
    if (!gameState || loading) return;
    setLoading(true);
    
    try {
      const outcome = await getGameOutcome(gameState, choice);
      const imageUrl = await generateImage(outcome.imagePrompt);
      
      const updatedAttributes = { ...gameState.player.attributes };
      Object.entries(outcome.attributeChanges).forEach(([key, value]) => {
        const attrKey = key as keyof typeof updatedAttributes;
        updatedAttributes[attrKey] = Math.max(0, Math.min(100, updatedAttributes[attrKey] + (value || 0)));
      });

      const updatedCurrency = {
        dinheiros: Math.max(0, gameState.player.currency.dinheiros + (outcome.currencyChanges?.dinheiros || 0)),
        sous: Math.max(0, gameState.player.currency.sous + (outcome.currencyChanges?.sous || 0)),
        libras: Math.max(0, gameState.player.currency.libras + (outcome.currencyChanges?.libras || 0)),
      };

      let updatedInventory = [...gameState.player.inventory];
      if (outcome.inventoryChanges?.add) updatedInventory.push(...outcome.inventoryChanges.add);
      if (outcome.inventoryChanges?.remove) {
        updatedInventory = updatedInventory.filter(item => !outcome.inventoryChanges?.remove?.includes(item));
      }

      const updatedNPCs = gameState.npcs.map(npc => {
        const change = outcome.npcChanges.find(c => c.id === npc.id);
        if (change) {
          return { 
            ...npc, 
            status: change.status || npc.status,
            relationship: change.relationship || npc.relationship,
            affinity: Math.max(0, Math.min(100, npc.affinity + (change.affinityChange || 0)))
          };
        }
        return npc;
      });

      const isDead = updatedAttributes.health <= 0 || outcome.isGameOver;

      const nextState: GameState = {
        ...gameState,
        player: {
          ...gameState.player,
          attributes: updatedAttributes,
          currency: updatedCurrency,
          inventory: updatedInventory,
          luck: Math.max(0, Math.min(100, gameState.player.luck + (outcome.luckChange || 0))),
          age: gameState.player.age + Math.floor((gameState.day + outcome.timePassedDays) / 365)
        },
        npcs: updatedNPCs,
        day: gameState.day + outcome.timePassedDays,
        weather: outcome.weather || gameState.weather,
        currentStory: outcome.story,
        currentImageUrl: imageUrl || undefined,
        choices: outcome.newChoices,
        isGameOver: isDead,
        deathReason: outcome.deathReason,
        criticalWarning: outcome.criticalWarning
      };

      setGameState(nextState);
      if (isDead) {
        setScreen('death');
      }
      playAudio(outcome.story);
    } catch (error) {
      console.error("Error processing choice:", error);
    } finally {
      setLoading(false);
    }
  };

  const restartGame = () => {
    setGameState(null);
    setScreen('start');
    setAudioUrl(null);
  };

  const toggleTheme = () => {
    const themes: ThemeType[] = ["parchment", "wood", "light", "castelo", "verdejo", "floresta"];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 24));
  };

  const themeStyles = {
    parchment: "bg-[#f5e6c8] text-[#2c1810] selection:bg-[#8b4513]/30",
    wood: "bg-[#2c1810] text-[#e0d8d0] selection:bg-[#ff4e00]/30",
    light: "bg-[#f8f9fa] text-[#212529] selection:bg-blue-200",
    castelo: "bg-[#3a3a3a] text-[#f0f0f0] selection:bg-gray-500",
    verdejo: "bg-[#2d4a22] text-[#e8f5e9] selection:bg-green-700",
    floresta: "bg-[#1b261b] text-[#dcedc8] selection:bg-green-900"
  };

  const getSeparatorIcon = () => {
    if (!gameState) return <Sword className="w-12 h-12" />;
    switch (gameState.player.lineageId) {
      case 1: return <Crown className="w-12 h-12" />;
      case 2: return <Sword className="w-12 h-12" />;
      case 3: return <Skull className="w-12 h-12" />;
      case 4: return <Sword className="w-12 h-12" />;
      case 5: return <Users className="w-12 h-12" />;
      default: return <Sword className="w-12 h-12" />;
    }
  };

  const getWeatherIcon = (weather: string) => {
    if (weather.includes("Chuva")) return <CloudRain className="w-5 h-5 text-blue-400" />;
    if (weather.includes("Tempestade")) return <Zap className="w-5 h-5 text-yellow-400" />;
    if (weather.includes("Vento")) return <Wind className="w-5 h-5 text-gray-400" />;
    return <Sun className="w-5 h-5 text-orange-400" />;
  };

  return (
    <div className={`min-h-screen font-serif transition-colors duration-500 ${themeStyles[theme]}`}>
      <audio ref={audioRef} src={audioUrl || undefined} />
      
      {/* Background Texture Overlay */}
      {theme === 'parchment' && (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-15 mix-blend-multiply" 
             style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/parchment.png")' }} />
      )}
      
      {/* Atmosphere Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className={`absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 ${theme === 'wood' ? 'bg-orange-900' : theme === 'verdejo' ? 'bg-green-900' : 'bg-amber-200'}`} />
        <div className={`absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] rounded-full blur-[120px] opacity-20 ${theme === 'wood' ? 'bg-red-900' : theme === 'verdejo' ? 'bg-emerald-900' : 'bg-amber-400'}`} />
      </div>

      {/* Fixed Status Bar */}
      {screen === 'game' && gameState && (
        <motion.div 
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-2"
        >
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest opacity-50">Personagem</span>
                <span className="text-sm font-bold flex items-center gap-2 text-white">
                  {gameState.player.name} <span className="opacity-50 text-xs">({gameState.player.age} anos)</span>
                </span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-4">
                <AttributeIcon icon={<Heart className="w-4 h-4 text-red-500" />} value={gameState.player.attributes.health} />
                <AttributeIcon icon={<Sword className="w-4 h-4 text-blue-400" />} value={gameState.player.attributes.strength} />
                <AttributeIcon icon={<Brain className="w-4 h-4 text-purple-400" />} value={gameState.player.attributes.intelligence} />
                <AttributeIcon icon={<Coins className="w-4 h-4 text-yellow-500" />} value={gameState.player.attributes.wealth} />
                <AttributeIcon icon={<Shield className="w-4 h-4 text-emerald-400" />} value={gameState.player.attributes.honor} />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end text-white">
                  <span className="text-[10px] uppercase tracking-widest opacity-50">{gameState.season}</span>
                  <span className="text-xs font-mono">Dia {gameState.day}</span>
                </div>
                {getWeatherIcon(gameState.weather)}
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-white">
                <Clover className="w-4 h-4 text-green-400" />
                <span className="text-sm font-bold">{gameState.player.luck}%</span>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-yellow-500">
                <Hourglass className="w-5 h-5 animate-pulse" />
              </div>
              <div className="h-8 w-px bg-white/10" />
              <button onClick={() => setIsMuted(!isMuted)} className="text-white">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className={`relative z-10 max-w-4xl mx-auto px-6 ${screen === 'game' ? 'pt-20' : 'py-12'} min-h-screen flex flex-col`}>
        {/* Header (Start/Selection) */}
        {screen !== 'game' && (
          <header className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <Sword className="w-8 h-8 text-[#ff4e00]" />
              <h1 className="text-3xl font-bold tracking-tighter uppercase italic">Vida Medieval</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleTheme} className="p-2 rounded-full border border-black/10 hover:bg-black/5"><Palette className="w-5 h-5" /></button>
              <button onClick={increaseFontSize} className="p-2 rounded-full border border-black/10 hover:bg-black/5"><TypeIcon className="w-5 h-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="p-2 rounded-full border border-black/10 hover:bg-black/5">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
            </div>
          </header>
        )}

        <main className="flex-grow flex flex-col">
          <AnimatePresence mode="wait">
          {screen === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="flex flex-col items-center justify-center min-h-[80vh] text-center"
            >
              <div className="relative mb-8">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-2 border-dashed border-black/10 rounded-full scale-150"
                />
                <Crown className="w-24 h-24 mb-4 text-[#8b4513]" />
              </div>
              <h1 className="text-7xl md:text-9xl font-black mb-4 italic tracking-tighter uppercase">
                Vida <span className="text-[#8b4513]">Medieval</span>
              </h1>
              <p className="text-xl md:text-2xl opacity-70 mb-12 max-w-2xl font-light leading-relaxed">
                Onde cada escolha escreve sua história — e tudo tem vida própria. Sobreviva aos reinos, pragas e traições da Europa do século XIII.
              </p>
              <button 
                onClick={handleStart}
                className="group relative px-12 py-5 bg-[#2c1810] text-white rounded-full text-xl font-bold overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                Começar Jornada
              </button>
            </motion.div>
          )}

            {screen === 'selection' && (
              <motion.div 
                key="selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="text-center mb-12">
                  <div className="flex justify-center mb-4"><Crown className="w-12 h-12 opacity-30" /></div>
                  <h2 className="text-4xl font-bold mb-2 italic uppercase tracking-widest">⚜️ Seleção de Linhagem</h2>
                  <div className="h-px w-32 bg-black/10 mx-auto mb-6" />
                  <p className="opacity-60 font-sans max-w-xl mx-auto">
                    Escolha sua origem — ela definirá seu destino desde o primeiro dia. Cada linhagem tem familiares, desafios e riscos próprios.
                  </p>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {LINEAGES.map((lineage) => (
                  <motion.button
                    key={lineage.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectLineage(lineage)}
                    className="flex flex-col text-left p-6 rounded-2xl bg-black/5 border border-black/10 hover:bg-black/10 transition-all group relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <span className="text-6xl">{lineage.icon}</span>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-3xl">{lineage.icon}</span>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{lineage.name}</h3>
                        <span className="text-[10px] uppercase tracking-widest opacity-50 font-sans">{lineage.kingdom}</span>
                      </div>
                    </div>
                    <p className="text-sm opacity-70 mb-6 font-sans flex-grow">
                      {lineage.description}
                    </p>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <AttributeTag icon={<Heart className="w-3 h-3" />} label="SAU" value={lineage.initialAttributes.health} />
                        <AttributeTag icon={<Sword className="w-3 h-3" />} label="FOR" value={lineage.initialAttributes.strength} />
                        <AttributeTag icon={<Brain className="w-3 h-3" />} label="INT" value={lineage.initialAttributes.intelligence} />
                        <AttributeTag icon={<Coins className="w-3 h-3" />} label="RIQ" value={lineage.initialAttributes.wealth} />
                        <AttributeTag icon={<Shield className="w-3 h-3" />} label="HON" value={lineage.initialAttributes.honor} />
                      </div>
                      <div className="pt-4 border-t border-black/5">
                        <span className="text-[10px] uppercase font-bold opacity-40 block mb-1">Desafio Inicial</span>
                        <p className="text-xs italic opacity-60 line-clamp-2">{lineage.initialChallenge}</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
              </motion.div>
            )}

          {screen === 'game' && gameState && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="pt-16 pb-32"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                  {/* Event Image */}
                  {gameState.currentImageUrl && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-black/10 aspect-video"
                    >
                      <img 
                        src={gameState.currentImageUrl} 
                        alt="Cena do jogo" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    </motion.div>
                  )}

                  <div className="space-y-6 bg-black/5 p-8 rounded-3xl border border-black/10">
                    {/* Visual Separator */}
                    <div className="flex justify-center opacity-20 py-4">
                      {getSeparatorIcon()}
                    </div>

                    {gameState.criticalWarning && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-6 bg-red-600/10 border-2 border-red-600 rounded-xl text-red-700 shadow-lg"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <AlertTriangle className="w-6 h-6 shrink-0 text-red-600" />
                          <span className="text-lg font-black uppercase tracking-tighter">Aviso Crítico</span>
                        </div>
                        <p className="text-lg font-bold leading-tight">{gameState.criticalWarning}</p>
                      </motion.div>
                    )}

                    <div className="prose prose-stone max-w-none" style={{ fontSize: `${fontSize}px` }}>
                      <div className="markdown-body">
                        <ReactMarkdown>
                          {gameState.currentStory}
                        </ReactMarkdown>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-8">
                      {gameState.choices.map((choice, idx) => (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.01, x: 5 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleChoice(choice)}
                          disabled={loading}
                          className={`group flex items-center justify-between p-5 rounded-xl border-2 transition-all text-left ${
                            idx === 0 ? "bg-amber-900/10 border-amber-900/20 hover:bg-amber-900/20" :
                            idx === 1 ? "bg-emerald-900/10 border-emerald-900/20 hover:bg-emerald-900/20" :
                            idx === 2 ? "bg-blue-900/10 border-blue-900/20 hover:bg-blue-900/20" :
                            "bg-stone-900/10 border-stone-900/20 hover:bg-stone-900/20"
                          }`}
                        >
                          <div className="flex-grow">
                            <span className="block font-bold text-lg mb-1">{choice.text}</span>
                            <span className="text-xs opacity-50 uppercase tracking-widest font-sans">{choice.consequenceHint}</span>
                          </div>
                          <ChevronRight className="w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Economy Card */}
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/10">
                    <h3 className="text-xs uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                      <Coins className="w-4 h-4" /> Economia
                    </h3>
                    <div className="space-y-3">
                      <CurrencyRow label="Libras" value={gameState.player.currency.libras} color="text-yellow-600" />
                      <CurrencyRow label="Sous" value={gameState.player.currency.sous} color="text-gray-500" />
                      <CurrencyRow label="Dinheiros" value={gameState.player.currency.dinheiros} color="text-orange-700" />
                    </div>
                  </div>

                  {/* Inventory Card */}
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/10">
                    <h3 className="text-xs uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                      <Backpack className="w-4 h-4" /> Inventário
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {gameState.player.inventory.map((item, i) => (
                        <span key={i} className="px-3 py-1 bg-black/10 rounded-full text-xs font-sans border border-black/5">
                          {item}
                        </span>
                      ))}
                      {gameState.player.inventory.length === 0 && <span className="text-xs opacity-40 italic">Vazio</span>}
                    </div>
                  </div>

                  {/* NPCs Card */}
                  <div className="bg-black/5 p-6 rounded-3xl border border-black/10">
                    <h3 className="text-xs uppercase tracking-widest font-black mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Relacionamentos
                    </h3>
                    <div className="space-y-4">
                      {gameState.npcs.map((npc) => (
                        <div key={npc.id} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-bold">{npc.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              npc.status === 'Vivo' ? 'bg-green-500/20 text-green-600' : 
                              npc.status === 'Doente' ? 'bg-yellow-500/20 text-yellow-600' : 
                              'bg-red-500/20 text-red-600'
                            }`}>
                              {npc.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-grow h-1.5 bg-black/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${npc.affinity}%` }}
                                className={`h-full ${npc.affinity > 70 ? 'bg-green-500' : npc.affinity > 30 ? 'bg-amber-500' : 'bg-red-500'}`}
                              />
                            </div>
                            <span className="text-[10px] font-mono opacity-50">{npc.affinity}%</span>
                          </div>
                          <span className="text-[10px] opacity-40 block italic">{npc.relationship}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

            {screen === 'death' && gameState && (
              <motion.div 
                key="death"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center text-center py-20"
              >
                <Skull className="w-24 h-24 text-red-600 mb-8 animate-pulse" />
                <h2 className="text-6xl font-black mb-4 uppercase tracking-tighter">Sua jornada terminou</h2>
                <p className="text-2xl italic opacity-60 mb-8 max-w-xl">
                  {gameState.deathReason || "A morte chegou silenciosa e implacável, como faz com todos os homens."}
                </p>
                <div className="flex gap-4 text-sm font-mono opacity-40 mb-12">
                  <span>Viveu até os {gameState.player.age} anos</span>
                  <span>•</span>
                  <span>Dia {gameState.day}</span>
                </div>
                <button 
                  onClick={restartGame}
                  className="flex items-center gap-2 px-8 py-3 rounded-full border border-black/20 hover:bg-black/10 transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="bg-[#f5e6c8] p-8 rounded-3xl border-4 border-[#8b4513] shadow-2xl flex flex-col items-center text-center max-w-xs">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="mb-4"
              >
                <Hourglass className="w-12 h-12 text-[#8b4513]" />
              </motion.div>
              <h3 className="text-xl font-bold text-[#2c1810] uppercase tracking-tighter mb-2">Tecendo o Destino...</h3>
              <p className="text-xs text-[#2c1810]/60 font-sans">As estrelas se alinham e os fios da vida são entrelaçados. Aguarde.</p>
            </div>
          </motion.div>
        )}

        {/* Customization Footer (Start/Selection only) */}
        {screen !== 'game' && screen !== 'death' && (
          <footer className="mt-12 pt-8 border-t border-black/10 flex justify-center gap-4">
            <button onClick={toggleTheme} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
              <Palette className="w-3 h-3" /> Mudar Tema
            </button>
            <button onClick={increaseFontSize} className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">
              <TypeIcon className="w-3 h-3" /> Aumentar Fonte
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}

function AttributeTag({ icon, label, value }: { icon: React.ReactNode, label: string, value: number }) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/10 border border-black/5 text-[10px] font-mono uppercase font-bold">
      <span className="opacity-70">{icon}</span>
      <span>{label}: <span className="text-[#8b4513]">{value}</span></span>
    </div>
  );
}

function AttributeIcon({ icon, value }: { icon: React.ReactNode, value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function CurrencyRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="opacity-60">{label}</span>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}
