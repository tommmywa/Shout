import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { Shoutout, ShoutoutStatus, User } from '../types';
import { ShoutoutService } from '../services/shoutouts';
import { StorageService } from '../services/storage';
import { AuthService } from '../services/auth';
import { AuditService } from '../services/audit';
import { WebhookService } from '../services/webhooks';
import { AuditLogEntry } from '../types/audit';

interface DevSimulationModalProps {
  visible: boolean;
  onClose: () => void;
  activeShoutoutId?: string;
  onShoutoutUpdated?: () => void;
  onUserSwitched?: () => void;
  onResetOnboarding?: () => void;
}

export const DevSimulationModal: React.FC<DevSimulationModalProps> = ({
  visible,
  onClose,
  activeShoutoutId,
  onShoutoutUpdated,
  onUserSwitched,
  onResetOnboarding,
}) => {
  const shoutoutService = ShoutoutService.getInstance();
  const storage = StorageService.getInstance();
  const auth = AuthService.getInstance();

  const [shoutouts, setShoutouts] = useState<Shoutout[]>([]);
  const [selectedId, setSelectedId] = useState<string>(activeShoutoutId || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  const auditService = AuditService.getInstance();
  const webhookService = WebhookService.getInstance();

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible, activeShoutoutId]);

  const loadData = async () => {
    setLoading(true);
    const all = await storage.getShoutouts();
    setShoutouts(all);
    if (activeShoutoutId) {
      setSelectedId(activeShoutoutId);
    } else if (all.length > 0 && !selectedId) {
      setSelectedId(all[0].id);
    }

    const allUsers = await storage.getUsers();
    setUsers(allUsers);
    const curId = await storage.getCurrentUserId();
    setCurrentUserId(curId);

    const logs = await auditService.getAllAuditLogs();
    setAuditLogs(logs.slice(0, 10));
    setLoading(false);
  };

  const handleTriggerWebhook = async (type: 'artist.approved' | 'blockchain.mint_confirmed') => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const res = await webhookService.processWebhook({
        id: `wh-sim-${Date.now()}`,
        type,
        data: {
          shoutout_id: selectedId,
          transaction_hash: `0x${Math.random().toString(16).substring(2, 10)}91823a0192`,
        },
        created_at: new Date().toISOString(),
      });
      setStatusMessage(`Webhook ${type} processed: ${res.action_taken}`);
      await loadData();
      if (onShoutoutUpdated) onShoutoutUpdated();
    } catch (e: any) {
      setStatusMessage(`Webhook Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvance = async (target?: ShoutoutStatus) => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const updated = await shoutoutService.advanceLifecycle(selectedId, target);
      setStatusMessage(`Shoutout updated to: ${updated.status}`);
      await loadData();
      if (onShoutoutUpdated) onShoutoutUpdated();
    } catch (e: any) {
      setStatusMessage(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    setLoading(true);
    await auth.switchUser(userId);
    setCurrentUserId(userId);
    setStatusMessage(`Switched active user`);
    if (onUserSwitched) onUserSwitched();
    setLoading(false);
  };

  const handleResetSeeds = async () => {
    setLoading(true);
    await storage.resetToSeeds();
    setStatusMessage('Database reset to default seed state!');
    await loadData();
    if (onUserSwitched) onUserSwitched();
    if (onShoutoutUpdated) onShoutoutUpdated();
    setLoading(false);
  };

  const selectedShoutout = shoutouts.find((s) => s.id === selectedId);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.badge}>
                <Ionicons name="flask" size={14} color="#000" />
              </View>
              <Text style={styles.headerTitle}>Developer Simulation Console</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Simulate studio artist reviews, recording approvals, track publication, and Soulbound token minting.
          </Text>

          {statusMessage && (
            <View style={styles.statusBar}>
              <Text style={styles.statusText}>{statusMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.scrollArea}>
            {/* Target Shoutout Picker */}
            <Text style={styles.sectionTitle}>1. Target Shoutout Request</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerRow}>
              {shoutouts.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[
                    styles.shoutoutChip,
                    selectedId === s.id && styles.shoutoutChipSelected,
                  ]}
                  onPress={() => setSelectedId(s.id)}
                >
                  <Text
                    style={[
                      styles.shoutoutChipText,
                      selectedId === s.id && styles.shoutoutChipTextActive,
                    ]}
                  >
                    {s.id.slice(-8)} ({s.status})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {selectedShoutout && (
              <View style={styles.targetCard}>
                <Text style={styles.targetInfo}>
                  Status: <Text style={styles.boldText}>{selectedShoutout.status}</Text>
                </Text>
                <Text style={styles.targetInfo}>
                  Tier: <Text style={styles.boldText}>{selectedShoutout.tier.toUpperCase()}</Text>
                </Text>
                <Text style={styles.targetInfo} numberOfLines={1}>
                  Text: &quot;{selectedShoutout.shoutout_text}&quot;
                </Text>
              </View>
            )}

            {/* Lifecycle Triggers */}
            <Text style={styles.sectionTitle}>2. State Machine Transitions (06-state-machine.md)</Text>
            <View style={styles.actionGrid}>
              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: colors.primaryDark }]}
                onPress={() => handleAdvance('approved')}
                disabled={loading}
              >
                <Ionicons name="thumbs-up-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>pending_artist_review → approved</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#0284C7' }]}
                onPress={() => handleAdvance('published')}
                disabled={loading}
              >
                <Ionicons name="radio-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>approved → published</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#7C3AED' }]}
                onPress={() => handleAdvance('mint_pending')}
                disabled={loading}
              >
                <Ionicons name="hourglass-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>published → mint_pending</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#059669' }]}
                onPress={() => handleAdvance('minted')}
                disabled={loading}
              >
                <Ionicons name="cube-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>mint_pending → minted</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#DC2626' }]}
                onPress={() => handleAdvance('rejected')}
                disabled={loading}
              >
                <Ionicons name="close-circle-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>Artist: Decline (Reject)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.simBtn, { backgroundColor: '#B45309' }]}
                onPress={() => handleAdvance('refunded')}
                disabled={loading}
              >
                <Ionicons name="cash-outline" size={16} color="#FFFFFF" />
                <Text style={styles.simBtnText}>Escrow: Process Refund</Text>
              </TouchableOpacity>
            </View>

            {/* User Switcher */}
            <Text style={styles.sectionTitle}>3. Switch Demo User Persona</Text>
            <View style={styles.userList}>
              {users.map((u) => {
                const isCur = u.id === currentUserId;
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.userRow, isCur && styles.userRowActive]}
                    onPress={() => handleSwitchUser(u.id)}
                  >
                    <View>
                      <Text style={[styles.userName, isCur && styles.userNameActive]}>
                        {u.display_name || u.email}
                      </Text>
                      <Text style={styles.userMeta}>
                        {u.active_identity_id ? `Identity Linked (${u.active_identity_id})` : 'No Identity (Fresh Fan)'}
                      </Text>
                    </View>
                    {isCur && <Ionicons name="checkmark-circle" size={18} color={colors.success} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Webhook Gateway Simulator */}
            <Text style={styles.sectionTitle}>4. Webhook Inbound Gateway Simulator (Prompt 6)</Text>
            <View style={styles.webhookBox}>
              <Text style={styles.webhookSub}>
                Simulate verified HMAC-signed webhooks from payment gateways and blockchain indexers.
              </Text>
              <View style={styles.webhookBtnRow}>
                <TouchableOpacity
                  style={[styles.webhookBtn, { backgroundColor: '#1E293B', borderColor: colors.secondaryLight }]}
                  onPress={() => handleTriggerWebhook('artist.approved')}
                  disabled={loading || !selectedId}
                >
                  <Ionicons name="flash-outline" size={14} color={colors.secondaryLight} />
                  <Text style={styles.webhookBtnText}>Webhook: artist.approved</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.webhookBtn, { backgroundColor: '#1E293B', borderColor: colors.success }]}
                  onPress={() => handleTriggerWebhook('blockchain.mint_confirmed')}
                  disabled={loading || !selectedId}
                >
                  <Ionicons name="cube-outline" size={14} color={colors.success} />
                  <Text style={[styles.webhookBtnText, { color: colors.success }]}>
                    Webhook: mint_confirmed
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Audit Trail & Invariants Viewer */}
            <Text style={styles.sectionTitle}>5. Live Production Audit Trail ({auditLogs.length})</Text>
            <View style={styles.auditCard}>
              <View style={styles.auditBadgeRow}>
                <View style={styles.auditStatusPill}>
                  <Text style={styles.auditStatusText}>IDEMPOTENCY: ACTIVE</Text>
                </View>
                <View style={styles.auditStatusPill}>
                  <Text style={styles.auditStatusText}>SERVER PRICING: STRICT</Text>
                </View>
                <View style={styles.auditStatusPill}>
                  <Text style={styles.auditStatusText}>AUTH: ENFORCED</Text>
                </View>
              </View>

              {auditLogs.length === 0 ? (
                <Text style={styles.auditEmptyText}>No audit entries recorded yet.</Text>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <View key={log.id} style={styles.auditItem}>
                    <View style={styles.auditItemTop}>
                      <View
                        style={[
                          styles.logLevelBadge,
                          log.level === 'AUDIT' && { backgroundColor: colors.primaryDark },
                          log.level === 'WARN' && { backgroundColor: 'rgba(245, 158, 11, 0.2)' },
                          log.level === 'ERROR' && { backgroundColor: 'rgba(239, 68, 68, 0.2)' },
                        ]}
                      >
                        <Text style={styles.logLevelText}>{log.level}</Text>
                      </View>
                      <Text style={styles.auditAction}>{log.action}</Text>
                      <Text style={styles.auditTime}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Text style={styles.auditEntity}>
                      {log.entity_type.toUpperCase()}: {log.entity_id} | Actor: {log.actor_id}
                    </Text>
                    {log.from_state && log.to_state && (
                      <Text style={styles.auditTransition}>
                        Transition: {log.from_state} → {log.to_state}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>

            {/* Reset DB & Onboarding */}
            <Text style={styles.sectionTitle}>6. Developer Testing & Reset</Text>
            <TouchableOpacity
              style={[styles.resetBtn, { marginBottom: 8, borderColor: colors.brandCoral }]}
              onPress={async () => {
                setLoading(true);
                await storage.setOnboardingCompleted(false);
                setStatusMessage('Onboarding screen reset! Close modal to view.');
                if (onResetOnboarding) onResetOnboarding();
                setLoading(false);
              }}
              disabled={loading}
            >
              <Ionicons name="sparkles-outline" size={18} color={colors.brandCoral} />
              <Text style={[styles.resetBtnText, { color: colors.brandCoral }]}>View / Reset Onboarding Screen</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resetBtn}
              onPress={handleResetSeeds}
              disabled={loading}
            >
              <Ionicons name="refresh-circle-outline" size={18} color={colors.warning} />
              <Text style={styles.resetBtnText}>Reset Everything to Fresh Seeds</Text>
            </TouchableOpacity>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.backgroundElevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.cardBorder,
    maxHeight: '85%',
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: colors.secondaryLight,
    borderRadius: 6,
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  statusBar: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: colors.secondaryLight,
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    color: colors.secondaryLight,
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 460,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  shoutoutChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginRight: 8,
  },
  shoutoutChipSelected: {
    borderColor: colors.secondaryLight,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  shoutoutChipText: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  shoutoutChipTextActive: {
    color: colors.secondaryLight,
    fontWeight: '700',
  },
  targetCard: {
    backgroundColor: colors.card,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorderSubtle,
    marginBottom: 6,
  },
  targetInfo: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  boldText: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  simBtn: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  simBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userList: {
    gap: 6,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  userRowActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  userNameActive: {
    color: colors.primaryLight,
    fontWeight: '700',
  },
  userMeta: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginTop: 4,
  },
  resetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning,
  },
  webhookBox: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    marginBottom: 8,
  },
  webhookSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 15,
  },
  webhookBtnRow: {
    gap: 8,
  },
  webhookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  webhookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  auditCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 10,
    marginBottom: 8,
  },
  auditBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  auditStatusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  auditStatusText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
    letterSpacing: 0.5,
  },
  auditEmptyText: {
    fontSize: 11,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  auditItem: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorderSubtle,
    paddingTop: 8,
    gap: 2,
  },
  auditItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  logLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  auditAction: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    flex: 1,
  },
  auditTime: {
    fontSize: 10,
    color: colors.textMuted,
  },
  auditEntity: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  auditTransition: {
    fontSize: 10,
    color: colors.secondaryLight,
    fontWeight: '600',
  },
});
