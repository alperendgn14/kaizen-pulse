import React, { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Alert, ScrollView
} from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import axios from 'axios';

// buraya benim pc'nin ip adresinin gelmesi gerekiyor, öbür türlü mobil cihazdan backend'e ulaşılamıyor.
const API_URL = 'http://192.168.1.170:8080/api/andon';

const Stack = createNativeStackNavigator();

function LiveAlertsScreen({ navigation }) {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(API_URL);
      setAlerts(res.data);
    } catch (err) {
      console.log('API bağlantı hatası:', err.message);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      // Boş gövde {} göndermek Android/React Native PATCH hatasını çözer
      await axios.patch(`${API_URL}/${id}/resolve`, {});
      fetchAlerts();
    } catch (err) {
      const detail = err.response?.status ? `HTTP ${err.response.status}` : err.message;
      Alert.alert('Hata', `Arıza kapatılamadı (${detail})`);
    }
  };

  const openCritical = alerts.filter(a => a.status === 'OPEN' && a.severity === 'CRITICAL').length;
  const openWarning = alerts.filter(a => a.status === 'OPEN' && a.severity === 'WARNING').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'OPEN') return a.status === 'OPEN';
    if (filter === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  const renderHeader = () => (
    <View style={{ marginBottom: 12 }}>
      {/* Canlı Akış & Manuel Andon Satırı */}
      <View style={styles.topActionRow}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>CANLI AKIŞ</Text>
        </View>
        <TouchableOpacity
          style={styles.triggerHeaderBtn}
          onPress={() => navigation.navigate('TriggerAndon')}
        >
          <Text style={styles.triggerHeaderBtnText}>🚨 MANUEL ANDON</Text>
        </TouchableOpacity>
      </View>

      {/* Web ile Birebir 3'lü KPI Kartları */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { borderTopColor: '#EB0A1E' }]}>
          <Text style={styles.kpiLabel}>KRİTİK</Text>
          <Text style={[styles.kpiValue, { color: '#ff4d5a' }]}>{openCritical}</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: '#f59e0b' }]}>
          <Text style={styles.kpiLabel}>UYARI</Text>
          <Text style={[styles.kpiValue, { color: '#fbbf24' }]}>{openWarning}</Text>
        </View>
        <View style={[styles.kpiCard, { borderTopColor: '#22c55e' }]}>
          <Text style={styles.kpiLabel}>ÇÖZÜLEN</Text>
          <Text style={[styles.kpiValue, { color: '#4ade80' }]}>{resolvedCount}</Text>
        </View>
      </View>

      {/* Filtre Sekmeleri */}
      <View style={styles.filterBar}>
        {[
          { key: 'ALL', label: `Tümü (${alerts.length})` },
          { key: 'OPEN', label: `Açık (${openCritical + openWarning})` },
          { key: 'RESOLVED', label: `Çözülen (${resolvedCount})` },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterBtn, filter === tab.key && styles.filterBtnActive]}
            onPress={() => setFilter(tab.key)}
          >
            <Text style={[styles.filterBtnText, filter === tab.key && styles.filterBtnTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderItem = ({ item }) => {
    const isCritical = item.severity === 'CRITICAL';
    const isOpen = item.status === 'OPEN';

    return (
      <View
        style={[
          styles.glassCard,
          { borderLeftColor: isOpen ? (isCritical ? '#EB0A1E' : '#f59e0b') : '#22c55e' },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.stationText}>{item.stationCode}</Text>
          <View
            style={[
              styles.badge,
              {
                backgroundColor: isCritical
                  ? 'rgba(235, 10, 30, 0.22)'
                  : 'rgba(245, 158, 11, 0.22)',
                borderColor: isCritical ? '#EB0A1E' : '#f59e0b',
              },
            ]}
          >
            <Text style={[styles.badgeText, { color: isCritical ? '#ff4d5a' : '#fbbf24' }]}>
              {item.severity}
            </Text>
          </View>
        </View>

        <Text style={styles.vinText}>{item.vehicleVin}</Text>
        <Text style={styles.descText}>{item.description}</Text>

        {item.aiRecommendation ? (
          <View style={styles.aiBox}>
            <Text style={styles.aiText}>🤖 {item.aiRecommendation}</Text>
          </View>
        ) : null}

        <View style={styles.cardFooter}>
          <View style={[styles.statusPill, !isOpen && styles.statusPillResolved]}>
            <Text style={[styles.statusText, { color: isOpen ? '#94a3b8' : '#4ade80' }]}>
              {item.status}
            </Text>
          </View>

          {isOpen ? (
            <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item.id)}>
              <Text style={styles.resolveBtnText}>✓ ÇÖZÜLDÜ</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.closedText}>✓ Kapatıldı</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#05070a" />
      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ padding: 14, paddingBottom: 30 }}
      />
    </SafeAreaView>
  );
}

function TriggerAndonScreen({ navigation }) {
  const [stationCode, setStationCode] = useState('WELD-01');
  const [vehicleVin, setVehicleVin] = useState('NMTBZ3BE00R777888');
  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');

  const stations = ['WELD-01', 'PAINT-03', 'TORQUE-02', 'ASSEMBLY-04'];

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen arıza açıklamasını yazın.');
      return;
    }
    try {
      await axios.post(API_URL, {
        stationCode,
        vehicleVin,
        severity,
        description,
        aiRecommendation: 'AI Analizi: Mobil saha operatörü tarafından bildirildi. İlgili istasyona teknisyen yönlendirildi.'
      });
      Alert.alert('Başarılı', 'Andon uyarısı kontrol merkezine iletildi!', [
        { text: 'Tamam', onPress: () => navigation.goBack() }
      ]);
    } catch (err) {
      Alert.alert('Bağlantı Hatası', 'Backend sunucusuna ulaşılamadı. IP adresini kontrol edin.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={[styles.glassCard, { borderLeftWidth: 1, borderTopWidth: 3, borderTopColor: '#EB0A1E' }]}>
        <Text style={styles.formTitle}>Manuel Andon İpi Çek</Text>
        <Text style={styles.formSub}>
          Üretim hattındaki kalite veya ekipman sorununu anında kontrol merkezine bildirin.
        </Text>

        <Text style={styles.label}>İSTASYON</Text>
        <View style={styles.chipRow}>
          {stations.map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.selectChip, stationCode === st && styles.selectChipActive]}
              onPress={() => setStationCode(st)}
            >
              <Text style={styles.selectChipText}>{st}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ACİLİYET SEVİYESİ</Text>
        <View style={styles.chipRow}>
          {['WARNING', 'CRITICAL'].map((sev) => (
            <TouchableOpacity
              key={sev}
              style={[styles.selectChip, severity === sev && styles.selectChipActive]}
              onPress={() => setSeverity(sev)}
            >
              <Text style={styles.selectChipText}>{sev}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>ARAÇ ŞASİ (VIN)</Text>
        <TextInput
          style={styles.input}
          value={vehicleVin}
          onChangeText={setVehicleVin}
          placeholderTextColor="#64748b"
        />

        <Text style={styles.label}>ARIZA AÇIKLAMASI</Text>
        <TextInput
          style={[styles.input, { height: 95, textAlignVertical: 'top' }]}
          value={description}
          onChangeText={setDescription}
          placeholder="Örn: Sağ kapı kaynak noktasında sapma tespit edildi..."
          placeholderTextColor="#64748b"
          multiline
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitBtnText}>ANDON UYARISI GÖNDER</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

export default function App() {
  return (
    <NavigationContainer theme={DarkTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#090c14' },
          headerTintColor: '#f8fafc',
          headerShadowVisible: false,
          headerTitleStyle: { fontWeight: '800', fontSize: 16 },
        }}
      >
        <Stack.Screen
          name="LiveAlerts"
          component={LiveAlertsScreen}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={styles.logoPill}>
                  <Text style={styles.logoText}>TOYOTA</Text>
                </View>
                <Text style={{ color: '#f8fafc', fontWeight: '800', fontSize: 16 }}>
                  KaizenPulse
                </Text>
              </View>
            ),
          }}
        />
        <Stack.Screen
          name="TriggerAndon"
          component={TriggerAndonScreen}
          options={{ title: 'Manuel Andon İpi Çek' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#05070a' },
  logoPill: {
    backgroundColor: 'rgba(235, 10, 30, 0.2)',
    borderWidth: 1,
    borderColor: '#EB0A1E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  logoText: { color: '#fff', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  liveBadgeText: { color: '#4ade80', fontWeight: '800', fontSize: 11, letterSpacing: 0.6 },
  triggerHeaderBtn: {
    backgroundColor: '#EB0A1E',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
  },
  triggerHeaderBtnText: { color: '#fff', fontWeight: '800', fontSize: 12, letterSpacing: 0.4 },
  kpiRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpiCard: {
    flex: 1,
    backgroundColor: 'rgba(18, 24, 38, 0.82)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderTopWidth: 3,
    alignItems: 'center',
  },
  kpiLabel: { color: '#94a3b8', fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  kpiValue: { fontSize: 26, fontWeight: '900', marginTop: 2 },
  filterBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(18, 24, 38, 0.82)',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  filterBtnActive: { backgroundColor: 'rgba(235, 10, 30, 0.28)' },
  filterBtnText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterBtnTextActive: { color: '#fff', fontWeight: '800' },
  glassCard: {
    backgroundColor: 'rgba(15, 20, 32, 0.85)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderLeftWidth: 4,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  stationText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.4 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  vinText: { color: '#94a3b8', fontFamily: 'monospace', fontSize: 12, marginBottom: 6 },
  descText: { color: '#f8fafc', fontSize: 14, fontWeight: '600', marginBottom: 10 },
  aiBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  aiText: { color: '#7dd3fc', fontSize: 12, lineHeight: 17 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusPill: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillResolved: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.4)',
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  resolveBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resolveBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  closedText: { color: '#4ade80', fontWeight: '800', fontSize: 12 },
  formTitle: { color: '#fff', fontSize: 19, fontWeight: '800', marginBottom: 4 },
  formSub: { color: '#94a3b8', fontSize: 12, marginBottom: 12 },
  label: { color: '#94a3b8', fontWeight: '700', fontSize: 11, letterSpacing: 0.8, marginBottom: 8, marginTop: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  selectChipActive: { backgroundColor: '#EB0A1E', borderColor: '#EB0A1E' },
  selectChipText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  input: {
    backgroundColor: 'rgba(5, 7, 10, 0.7)',
    color: '#fff',
    borderRadius: 10,
    padding: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  submitBtn: {
    backgroundColor: '#EB0A1E',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 22,
  },
  submitBtnText: { color: '#fff', fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
});