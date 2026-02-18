import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header } from '../../src/components/layout';
import { FAB, EmptyState, LoadingScreen } from '../../src/components/ui';
import {
  useInspectionList,
  useIncidentList,
  useSafetySummary,
} from '../../src/hooks/useSafety';
import {
  useTheme,
  type ThemeColors,
  spacing,
  borderRadius,
} from '../../src/theme';
import type { SafetyInspection, SafetyIncident } from '@jobreceipt/shared';

type Tab = 'inspections' | 'incidents';

const getInspectionStatusStyle = (
  status: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string } => {
  switch (status) {
    case 'OPEN':
      return {
        bg: colors.warning + '20',
        text: colors.warning,
        label: 'Open',
      };
    case 'COMPLETE':
      return {
        bg: colors.success + '20',
        text: colors.success,
        label: 'Complete',
      };
    default:
      return {
        bg: colors.textMuted + '20',
        text: colors.textMuted,
        label: status,
      };
  }
};

const getSeverityStyle = (
  severity: string,
  colors: ThemeColors,
): { bg: string; text: string; label: string; bold: boolean } => {
  switch (severity) {
    case 'LOW':
      return {
        bg: colors.textMuted + '20',
        text: colors.textMuted,
        label: 'Low',
        bold: false,
      };
    case 'MEDIUM':
      return {
        bg: colors.warning + '20',
        text: colors.warning,
        label: 'Medium',
        bold: false,
      };
    case 'HIGH':
      return {
        bg: colors.error + '20',
        text: colors.error,
        label: 'High',
        bold: false,
      };
    case 'CRITICAL':
      return {
        bg: colors.error + '20',
        text: colors.error,
        label: 'Critical',
        bold: true,
      };
    default:
      return {
        bg: colors.textMuted + '20',
        text: colors.textMuted,
        label: severity,
        bold: false,
      };
  }
};

const getIncidentStatusLabel = (status: string): string => {
  switch (status) {
    case 'OPEN':
      return 'Open';
    case 'INVESTIGATING':
      return 'Investigating';
    case 'RESOLVED':
      return 'Resolved';
    case 'CLOSED':
      return 'Closed';
    default:
      return status;
  }
};

const getIncidentTypeIcon = (
  type: string,
): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'INJURY':
      return 'medkit-outline';
    case 'NEAR_MISS':
      return 'warning-outline';
    case 'PROPERTY_DAMAGE':
      return 'home-outline';
    case 'ENVIRONMENTAL':
      return 'leaf-outline';
    case 'OTHER':
    default:
      return 'alert-circle-outline';
  }
};

const getIncidentTypeLabel = (type: string): string => {
  switch (type) {
    case 'INJURY':
      return 'Injury';
    case 'NEAR_MISS':
      return 'Near Miss';
    case 'PROPERTY_DAMAGE':
      return 'Property Damage';
    case 'ENVIRONMENTAL':
      return 'Environmental';
    case 'OTHER':
      return 'Other';
    default:
      return type;
  }
};

export default function SafetyListScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [activeTab, setActiveTab] = useState<Tab>('inspections');

  const { data: summary } = useSafetySummary();
  const {
    data: inspectionsData,
    isLoading: inspectionsLoading,
    refetch: refetchInspections,
    isRefetching: inspectionsRefetching,
  } = useInspectionList();
  const {
    data: incidentsData,
    isLoading: incidentsLoading,
    refetch: refetchIncidents,
    isRefetching: incidentsRefetching,
  } = useIncidentList();

  const inspections = inspectionsData?.data ?? [];
  const incidents = incidentsData?.data ?? [];

  const isLoading =
    activeTab === 'inspections' ? inspectionsLoading : incidentsLoading;

  if (isLoading) return <LoadingScreen />;

  const renderInspectionItem = ({ item }: { item: SafetyInspection }) => {
    const statusStyle = getInspectionStatusStyle(item.status, colors);
    const compliantCount =
      item.items?.filter((i) => i.isCompliant).length ?? 0;
    const totalCount = item.items?.length ?? 0;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/safety/inspection/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}>
            <Ionicons
              name="clipboard-outline"
              size={20}
              color={colors.primary}
            />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.templateName}
            </Text>
            <View style={styles.cardMeta}>
              {item.job && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="briefcase-outline"
                    size={11}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>{item.job.name}</Text>
                </View>
              )}
              <Text style={styles.metaText}>
                {compliantCount}/{totalCount} items
              </Text>
            </View>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusText, { color: statusStyle.text }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
        <Text style={styles.dateText}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderIncidentItem = ({ item }: { item: SafetyIncident }) => {
    const severityStyle = getSeverityStyle(item.severity, colors);
    const iconName = getIncidentTypeIcon(item.type);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/safety/incident/${item.id}`)}
        activeOpacity={0.7}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardIcon}>
            <Ionicons name={iconName} size={20} color={colors.error} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.cardMeta}>
              <Text style={styles.metaText}>
                {getIncidentTypeLabel(item.type)}
              </Text>
              {item.job && (
                <View style={styles.metaItem}>
                  <Ionicons
                    name="briefcase-outline"
                    size={11}
                    color={colors.textMuted}
                  />
                  <Text style={styles.metaText}>{item.job.name}</Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.badgeColumn}>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: severityStyle.bg },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: severityStyle.text },
                  severityStyle.bold && { fontWeight: '900' },
                ]}
              >
                {severityStyle.label}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.metaText}>
            {getIncidentStatusLabel(item.status)}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.incidentDate).toLocaleDateString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const headerComponent = (
    <View>
      {/* Summary Card */}
      {summary && (summary.totalInspections > 0 || summary.totalIncidents > 0) && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryCount, { color: colors.error }]}
              >
                {summary.openIncidents}
              </Text>
              <Text style={styles.summaryLabel}>Open Incidents</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryCount, { color: colors.primary }]}
              >
                {summary.inspectionsThisMonth}
              </Text>
              <Text style={styles.summaryLabel}>This Month</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text
                style={[styles.summaryCount, { color: colors.success }]}
              >
                {summary.totalInspections}
              </Text>
              <Text style={styles.summaryLabel}>Inspections</Text>
            </View>
          </View>
        </View>
      )}

      {/* Tab Toggle */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'inspections' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('inspections')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'inspections' && styles.tabTextActive,
            ]}
          >
            Inspections
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'incidents' && styles.tabActive,
          ]}
          onPress={() => setActiveTab('incidents')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'incidents' && styles.tabTextActive,
            ]}
          >
            Incidents
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (activeTab === 'inspections') {
    return (
      <Screen padded={false}>
        <Header title="Safety" showBack />
        <FlatList
          data={inspections}
          ListHeaderComponent={headerComponent}
          renderItem={renderInspectionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={inspectionsRefetching}
          onRefresh={refetchInspections}
          ListEmptyComponent={
            <EmptyState
              title="No Inspections"
              message="Start a safety inspection from a template to track compliance."
              actionLabel="New Inspection"
              onAction={() => router.push('/safety/create-inspection')}
            />
          }
        />
        <FAB
          onPress={() => router.push('/safety/create-inspection')}
          icon="add"
          label="New Inspection"
        />
      </Screen>
    );
  }

  return (
    <Screen padded={false}>
      <Header title="Safety" showBack />
      <FlatList
        data={incidents}
        ListHeaderComponent={headerComponent}
        renderItem={renderIncidentItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={incidentsRefetching}
        onRefresh={refetchIncidents}
        ListEmptyComponent={
          <EmptyState
            title="No Incidents"
            message="Report safety incidents to track and resolve them."
            actionLabel="Report Incident"
            onAction={() => router.push('/safety/create-incident')}
          />
        }
      />
      <FAB
        onPress={() => router.push('/safety/create-incident')}
        icon="add"
        label="Report Incident"
      />
    </Screen>
  );
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    list: {
      padding: spacing.lg,
      paddingBottom: 100,
    },
    summaryCard: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    summaryItem: {
      alignItems: 'center',
    },
    summaryCount: {
      fontSize: 22,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textMuted,
      marginTop: 2,
    },
    tabRow: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    tab: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    tabActive: {
      backgroundColor: colors.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    tabTextActive: {
      color: colors.white,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    cardContent: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    cardMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    metaText: {
      fontSize: 12,
      color: colors.textMuted,
    },
    badgeColumn: {
      alignItems: 'flex-end',
      marginLeft: spacing.sm,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: borderRadius.full,
      marginLeft: spacing.sm,
    },
    statusText: {
      fontSize: 10,
      fontWeight: '700',
    },
    dateText: {
      fontSize: 11,
      color: colors.textMuted,
      marginTop: spacing.xs,
      textAlign: 'right',
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
      paddingLeft: 36 + spacing.md,
    },
  });
