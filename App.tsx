import React, { useEffect, useState } from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import {
  GlobalIdentity,
  Shoutout,
  ShoutoutOrder,
  Song,
  User,
} from './src/types';
import { StorageService } from './src/services/storage';
import { AuthService, AuthSession } from './src/services/auth';
import { IdentityService } from './src/services/identity';
import { AudioPlaybackState, AudioService } from './src/services/audio';
import { Header } from './src/components/Header';
import { BottomNav } from './src/components/BottomNav';
import { FloatingAudioBar } from './src/components/FloatingAudioBar';
import { AudioPlayerModal } from './src/components/AudioPlayerModal';
import { DevSimulationModal } from './src/components/DevSimulationModal';
import { DiscoverScreen } from './src/screens/DiscoverScreen';
import { SongDetailScreen } from './src/screens/SongDetailScreen';
import { AuthModal } from './src/screens/AuthModal';
import { IdentitySetupScreen } from './src/screens/IdentitySetupScreen';
import { PurchaseFlowModal } from './src/screens/PurchaseFlowModal';
import { ShoutoutDetailScreen } from './src/screens/ShoutoutDetailScreen';
import { MyShoutoutsScreen } from './src/screens/MyShoutoutsScreen';
import { IdentityProfileScreen } from './src/screens/IdentityProfileScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { DiscoverAssetPreloader } from './src/components/DiscoverAssetPreloader';
import { SearchScreen } from './src/screens/SearchScreen';
import { ClaimIdScreen } from './src/screens/ClaimIdScreen';

export default function App() {
  const storage = StorageService.getInstance();
  const auth = AuthService.getInstance();
  const identityService = IdentityService.getInstance();
  const audio = AudioService.getInstance();

  // App core state
  const [user, setUser] = useState<User | null>(null);
  const [identity, setIdentity] = useState<GlobalIdentity | null>(null);
  const [activeTab, setActiveTab] = useState<'discover' | 'my_shoutouts' | 'my_identity'>('discover');
  // Always start on onboarding when the app opens or reloads in Expo Go
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);

  // Navigation Stack drill-down state
  const [selectedSongId, setSelectedSongId] = useState<string | null>(null);
  const [selectedShoutoutId, setSelectedShoutoutId] = useState<string | null>(null);
  const [selectedProfileHandle, setSelectedProfileHandle] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showIdentitySetup, setShowIdentitySetup] = useState(false);
  const [purchaseSong, setPurchaseSong] = useState<Song | null>(null);
  const [pendingTargetSong, setPendingTargetSong] = useState<Song | null>(null);
  const [showDevModal, setShowDevModal] = useState(false);
  const [devTargetShoutoutId, setDevTargetShoutoutId] = useState<string | undefined>();
  const [showFullPlayer, setShowFullPlayer] = useState(false);

  // Audio Playback
  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(audio.getState());

  // Pending shoutouts counter for badge
  const [pendingBadgeCount, setPendingBadgeCount] = useState(0);

  // Dedicated Search Page state
  const [showSearchScreen, setShowSearchScreen] = useState(false);

  // Claim ID Intro Screen (Figma node 2106:3276)
  const [showClaimIdScreen, setShowClaimIdScreen] = useState(false);

  // Initialize storage, auth, and audio
  useEffect(() => {
    const initApp = async () => {
      await storage.init();
      // Keep onboarding as initial landing page on every fresh app load
      setHasCompletedOnboarding(false);
      const session = await auth.getSession();
      setUser(session.user);
      if (session.user?.id) {
        const id = await identityService.getIdentityForUser(session.user.id);
        setIdentity(id);
        updatePendingCount(session.user.id);
      }
    };

    initApp();

    // Subscribe to auth changes
    const unsubAuth = auth.subscribe(async (session: AuthSession) => {
      setUser(session.user);
      if (session.user) {
        const id = await identityService.getIdentityForUser(session.user.id);
        setIdentity(id);
        updatePendingCount(session.user.id);
      } else {
        setIdentity(null);
        setPendingBadgeCount(0);
      }
    });

    // Subscribe to audio changes
    const unsubAudio = audio.subscribe((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubAuth();
      unsubAudio();
    };
  }, []);

  const updatePendingCount = async (userId: string) => {
    const shoutouts = await storage.getShoutouts();
    const curUser = (await storage.getUsers()).find((u) => u.id === userId);
    if (curUser?.active_identity_id) {
      const pending = shoutouts.filter(
        (s) =>
          s.identity_id === curUser.active_identity_id &&
          ['pending_artist_review', 'approved'].includes(s.status)
      );
      setPendingBadgeCount(pending.length);
    }
  };

  // Handle "Get a Shoutout" CTA click
  const handleInitiateShoutout = async (song: Song) => {
    if (!user) {
      // Save return context and prompt auth
      await auth.setReturnContext({ screen: 'purchase', songId: song.id });
      setPendingTargetSong(song);
      setShowAuthModal(true);
      return;
    }

    if (!identity) {
      // Save return context and prompt identity setup
      await auth.setReturnContext({ screen: 'purchase', songId: song.id });
      setPendingTargetSong(song);
      setShowIdentitySetup(true);
      return;
    }

    // Authenticated & has identity -> open purchase modal
    setPurchaseSong(song);
  };

  // Handle after user signs in / up
  const handleAuthSuccess = async () => {
    await storage.setOnboardingCompleted(true);
    setHasCompletedOnboarding(true);
    const context = await auth.getAndClearReturnContext();
    if (context && context.screen === 'purchase' && context.songId) {
      const targetSong = (await storage.getSongs()).find((s) => s.id === context.songId);
      const session = await auth.getSession();
      const id = session.user?.id
        ? await identityService.getIdentityForUser(session.user.id)
        : null;

      if (!id) {
        // Needs identity setup first
        if (targetSong) setPendingTargetSong(targetSong);
        setShowIdentitySetup(true);
      } else if (targetSong) {
        setPurchaseSong(targetSong);
      }
    }
  };

  // Handle after identity claimed
  const handleIdentityCreated = async (claimedHandle: string) => {
    setShowIdentitySetup(false);
    const session = await auth.getSession();
    if (session.user) {
      const id = await identityService.getIdentityForUser(session.user.id);
      setIdentity(id);
    }

    if (pendingTargetSong) {
      setPurchaseSong(pendingTargetSong);
      setPendingTargetSong(null);
    } else {
      const context = await auth.getAndClearReturnContext();
      if (context && context.screen === 'purchase' && context.songId) {
        const targetSong = (await storage.getSongs()).find((s) => s.id === context.songId);
        if (targetSong) {
          setPurchaseSong(targetSong);
        }
      }
    }
  };

  // Handle completed purchase
  const handleOrderCompleted = (order: ShoutoutOrder, shoutoutId: string) => {
    setPurchaseSong(null);
    setSelectedSongId(null);
    setSelectedShoutoutId(shoutoutId);
    if (user) updatePendingCount(user.id);
  };

  // Handle playing audio
  const handlePlaySong = async (song: Song) => {
    if (playbackState.currentSong?.id === song.id && playbackState.isPlaying) {
      audio.pause();
    } else {
      await audio.play(song);
    }
  };

  // Render current screen content
  const renderScreen = () => {
    if (showIdentitySetup && user) {
      return (
        <IdentitySetupScreen
          user={user}
          returnSongTitle={pendingTargetSong?.title}
          onBack={() => {
            setShowIdentitySetup(false);
            setPendingTargetSong(null);
          }}
          onIdentityCreated={handleIdentityCreated}
        />
      );
    }

    if (selectedShoutoutId) {
      return (
        <ShoutoutDetailScreen
          shoutoutId={selectedShoutoutId}
          onBack={() => setSelectedShoutoutId(null)}
          onOpenSong={(s) => {
            setSelectedShoutoutId(null);
            setSelectedSongId(s.id);
          }}
          onOpenIdentity={(handle) => {
            setSelectedShoutoutId(null);
            setSelectedProfileHandle(handle);
            setActiveTab('my_identity');
          }}
          onOpenDevSheet={(id) => {
            setDevTargetShoutoutId(id);
            setShowDevModal(true);
          }}
        />
      );
    }

    if (selectedSongId) {
      return (
        <SongDetailScreen
          songId={selectedSongId}
          onBack={() => setSelectedSongId(null)}
          onRequestShoutout={(s) => handleInitiateShoutout(s)}
          onPlaySong={handlePlaySong}
          playbackState={playbackState}
          onSelectIdentity={(handle) => {
            setSelectedSongId(null);
            setSelectedProfileHandle(handle);
            setActiveTab('my_identity');
          }}
        />
      );
    }

    if (showClaimIdScreen) {
      return (
        <ClaimIdScreen
          onBack={() => setShowClaimIdScreen(false)}
          onContinue={() => {
            setShowClaimIdScreen(false);
            if (!user) {
              setShowAuthModal(true);
            } else {
              setShowIdentitySetup(true);
            }
          }}
        />
      );
    }

    if (showSearchScreen) {
      return (
        <SearchScreen
          onBack={() => setShowSearchScreen(false)}
          onSelectSong={(s) => {
            setShowSearchScreen(false);
            setSelectedSongId(s.id);
          }}
          onRequestShoutout={(s) => {
            setShowSearchScreen(false);
            handleInitiateShoutout(s);
          }}
          onPlaySong={handlePlaySong}
          currentPlayingSongId={playbackState.currentSong?.id}
          isPlaying={playbackState.isPlaying}
          onSelectArtist={(artist) => {
            setShowSearchScreen(false);
            setSelectedProfileHandle(artist.handle);
            setActiveTab('my_identity');
          }}
        />
      );
    }

    switch (activeTab) {
      case 'discover':
        return (
          <DiscoverScreen
            onSelectSong={(s) => setSelectedSongId(s.id)}
            onRequestShoutout={handleInitiateShoutout}
            onPlaySong={handlePlaySong}
            currentPlayingSongId={playbackState.currentSong?.id}
            isPlaying={playbackState.isPlaying}
            onOpenIdentitySetup={() => setShowClaimIdScreen(true)}
          />
        );

      case 'my_shoutouts':
        return (
          <MyShoutoutsScreen
            user={user}
            identity={identity}
            onOpenShoutout={(id) => setSelectedShoutoutId(id)}
            onDiscoverSongs={() => setActiveTab('discover')}
            onOpenIdentitySetup={() => setShowIdentitySetup(true)}
          />
        );

      case 'my_identity':
        return (
          <IdentityProfileScreen
            handleOrId={selectedProfileHandle || undefined}
            currentUser={user}
            onOpenSong={(s) => {
              setSelectedProfileHandle(null);
              setSelectedSongId(s.id);
            }}
            onOpenIdentitySetup={() => setShowIdentitySetup(true)}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenShoutout={(id) => setSelectedShoutoutId(id)}
          />
        );
    }
  };

  if (hasCompletedOnboarding === false) {
    return (
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />
        <DiscoverAssetPreloader />
        <OnboardingScreen
          onGetStarted={async () => {
            await storage.setOnboardingCompleted(true);
            const session = await auth.getSession();
            if (session.user) {
              setUser(session.user);
              const id = await identityService.getIdentityForUser(session.user.id);
              setIdentity(id);
              updatePendingCount(session.user.id);
            }
            setActiveTab('discover');
            setSelectedSongId(null);
            setSelectedShoutoutId(null);
            setSelectedProfileHandle(null);
            setShowAuthModal(false);
            setHasCompletedOnboarding(true);
          }}
          onAlreadyHaveAccount={() => {
            setShowAuthModal(true);
          }}
          onSkip={async () => {
            await storage.setOnboardingCompleted(true);
            setActiveTab('discover');
            setSelectedSongId(null);
            setSelectedShoutoutId(null);
            setSelectedProfileHandle(null);
            setShowAuthModal(false);
            setHasCompletedOnboarding(true);
          }}
        />
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <DiscoverAssetPreloader />
      <SafeAreaView style={styles.rootContainer} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor={colors.backgroundElevated} />

        {/* Top Header */}
        {!showSearchScreen && !showClaimIdScreen && (
          <Header
            user={user}
            identity={identity}
            onOpenIdentitySetup={() => setShowClaimIdScreen(true)}
            onOpenAuth={() => setShowAuthModal(true)}
            onOpenDevSheet={() => setShowDevModal(true)}
            onOpenOnboarding={() => setHasCompletedOnboarding(false)}
            onOpenMyIdentity={() => {
              setSelectedProfileHandle(null);
              setSelectedSongId(null);
              setSelectedShoutoutId(null);
              setActiveTab('my_identity');
            }}
            onOpenSearch={() => setShowSearchScreen(true)}
          />
        )}

        {/* Screen Area */}
        <View style={styles.screenContainer}>{renderScreen()}</View>

        {/* Docked Mini Audio Player */}
        {playbackState.currentSong && (
          <FloatingAudioBar
            playbackState={playbackState}
            onTogglePlay={() => {
              if (playbackState.isPlaying) {
                audio.pause();
              } else if (playbackState.currentSong) {
                audio.resume();
              }
            }}
            onOpenFullPlayer={() => setShowFullPlayer(true)}
          />
        )}

        {/* Bottom Tab Bar */}
        <BottomNav
          currentTab={activeTab}
          onSelectTab={(tab) => {
            setSelectedSongId(null);
            setSelectedShoutoutId(null);
            setSelectedProfileHandle(null);
            setShowIdentitySetup(false);
            setShowSearchScreen(false);
            setShowClaimIdScreen(false);
            setActiveTab(tab);
          }}
          pendingCount={pendingBadgeCount}
        />

        {/* Full-Screen Audio Player Modal */}
        <AudioPlayerModal
          visible={showFullPlayer}
          onClose={() => setShowFullPlayer(false)}
          playbackState={playbackState}
          onTogglePlay={() => {
            if (playbackState.isPlaying) {
              audio.pause();
            } else if (playbackState.currentSong) {
              audio.resume();
            }
          }}
          onRequestShoutout={() => {
            if (playbackState.currentSong) {
              handleInitiateShoutout(playbackState.currentSong);
            }
          }}
        />

        {/* Purchase Funnel Modal */}
        {purchaseSong && user && identity && (
          <PurchaseFlowModal
            visible={!!purchaseSong}
            onClose={() => setPurchaseSong(null)}
            song={purchaseSong}
            user={user}
            identity={identity}
            onOrderCompleted={handleOrderCompleted}
            onDiscoverMore={() => {
              setSelectedSongId(null);
              setActiveTab('discover');
            }}
          />
        )}

        {/* Auth Modal */}
        <AuthModal
          visible={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />

        {/* Developer / Admin Simulation Drawer Modal */}
        <DevSimulationModal
          visible={showDevModal}
          onClose={() => setShowDevModal(false)}
          activeShoutoutId={devTargetShoutoutId}
          onShoutoutUpdated={() => {
            if (user) updatePendingCount(user.id);
          }}
          onUserSwitched={async () => {
            const session = await auth.getSession();
            setUser(session.user);
            if (session.user) {
              const id = await identityService.getIdentityForUser(session.user.id);
              setIdentity(id);
              updatePendingCount(session.user.id);
            }
          }}
          onResetOnboarding={() => {
            setShowDevModal(false);
            setHasCompletedOnboarding(false);
          }}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  screenContainer: {
    flex: 1,
  },
});
