import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
  ThemeProvider, createTheme, CssBaseline,
  AppBar, Toolbar, Typography, Container, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Button, Box, TextField, MenuItem, Stack, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import VerifiedIcon from '@mui/icons-material/Verified';
import html2pdf from 'html2pdf.js';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import CircularProgress from '@mui/material/CircularProgress';

const API_URL = 'http://localhost:8080/api/andon';

const toyotaAeroTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#EB0A1E' },
    background: {
      default: 'transparent',
      paper: 'rgba(18, 24, 38, 0.55)',
    },
  },
  typography: {
    fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
  },
  shape: {
    borderRadius: 16,
  },
});

// Ortak Aero Glass (Buzlu Cam) Stili
const aeroGlassStyle = {
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(10, 13, 20, 0.78) 100%)',
  backdropFilter: 'blur(20px) saturate(160%)',
  WebkitBackdropFilter: 'blur(20px) saturate(160%)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
};

// Metalik Krom Efektli, Orantılı Toyota Amblemi
function ToyotaLogo() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1.4,
        py: 0.7,
        borderRadius: '12px',
        background: 'linear-gradient(145deg, rgba(235, 10, 30, 0.22), rgba(255, 255, 255, 0.05))',
        border: '1px solid rgba(235, 10, 30, 0.45)',
        boxShadow: '0 0 18px rgba(235, 10, 30, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
      }}
    >
      <svg width="46" height="30" viewBox="0 0 120 76" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="48%" stopColor="#E2E8F0" />
            <stop offset="52%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#F8FAFC" />
          </linearGradient>
          <filter id="logoGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#EB0A1E" floodOpacity="0.6" />
          </filter>
        </defs>
        <g filter="url(#logoGlow)">
          <ellipse cx="60" cy="38" rx="53" ry="32" stroke="url(#chromeGrad)" strokeWidth="6.5" />
          <ellipse cx="60" cy="38" rx="14.5" ry="29.5" stroke="url(#chromeGrad)" strokeWidth="5.5" />
          <ellipse cx="60" cy="23.5" rx="34" ry="12" stroke="url(#chromeGrad)" strokeWidth="5.5" />
        </g>
      </svg>
    </Box>
  );
}

function LiveDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [kaizenReports, setKaizenReports] = useState({});
  const [loadingReportId, setLoadingReportId] = useState(null);

  const fetchAlerts = async () => {
    try {
      const res = await axios.get(API_URL);
      setAlerts(res.data);
    } catch (err) {
      console.error('API bağlantı hatası:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    await axios.patch(`${API_URL}/${id}/resolve`);
    fetchAlerts();
  };

  const handleGenerateReport = async (alert) => {
    setLoadingReportId(alert.id);
    try {
      const res = await axios.post(`${API_URL}/${alert.id}/kaizen-report`);
      setKaizenReports(prev => ({ ...prev, [alert.id]: res.data.report }));
    } catch (err) {
      console.error('5-Why rapor hatası:', err);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDownloadPdf = (alert, reportText) => {
    const formattedReport = reportText
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; padding: 28px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #EB0A1E; padding-bottom: 14px; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <svg width="56" height="36" viewBox="0 0 120 76" fill="none" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="60" cy="38" rx="53" ry="32" stroke="#EB0A1E" stroke-width="7" />
              <ellipse cx="60" cy="38" rx="14.5" ry="29.5" stroke="#EB0A1E" stroke-width="6" />
              <ellipse cx="60" cy="23.5" rx="34" ry="12" stroke="#EB0A1E" stroke-width="6" />
            </svg>
            <div>
              <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 0.5px;">
                TOYOTA <span style="color: #EB0A1E;">|</span> KaizenPulse
              </div>
              <div style="font-size: 11px; color: #64748b; font-weight: 600;">
                SAKARYA ÜRETİM HATTI — 5-WHY KAİZEN & KÖK NEDEN RAPORU
              </div>
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; color: #475569;">
            <div><strong>Rapor No:</strong> KP-5WHY-${alert.id}</div>
            <div><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px;">
          <tr>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; width: 25%;"><strong>İstasyon:</strong> ${alert.stationCode}</td>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; width: 35%;"><strong>Araç VIN:</strong> ${alert.vehicleVin}</td>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; width: 20%;"><strong>Seviye:</strong> <span style="color: #EB0A1E; font-weight: bold;">${alert.severity}</span></td>
            <td style="padding: 8px 12px; background: #f8fafc; border: 1px solid #cbd5e1; width: 20%;"><strong>Durum:</strong> ${alert.status}</td>
          </tr>
          <tr>
            <td colspan="4" style="padding: 10px 12px; border: 1px solid #cbd5e1;">
              <strong>Arıza Özeti:</strong> ${alert.description}
            </td>
          </tr>
        </table>

        <div style="background: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #EB0A1E; padding: 18px; border-radius: 6px; font-size: 12.5px; line-height: 1.75; color: #0f172a;">
          ${formattedReport}
        </div>

        <div style="margin-top: 28px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 14px;">
          <div><strong>Hazırlayan:</strong> KaizenPulse AI Motoru</div>
          <div><strong>Bakım Mühendisi Onayı:</strong> _______________________</div>
          <div><strong>Vardiya Amiri:</strong> _______________________</div>
        </div>
      </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = htmlContent;

    html2pdf()
      .set({
        margin: 8,
        filename: `Toyota_5Why_Kaizen_${alert.stationCode}_${alert.id}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container)
      .save();
  };

  const openCritical = alerts.filter(a => a.status === 'OPEN' && a.severity === 'CRITICAL').length;
  const openWarning = alerts.filter(a => a.status === 'OPEN' && a.severity === 'WARNING').length;
  const resolvedCount = alerts.filter(a => a.status === 'RESOLVED').length;

  const filteredAlerts = alerts.filter(a => {
    if (filter === 'OPEN') return a.status === 'OPEN';
    if (filter === 'RESOLVED') return a.status === 'RESOLVED';
    return true;
  });

  return (
    <Box sx={{ py: 4 }}>
      {/* Tam Genişlikli Aero Glass KPI Kartları */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4,
        }}
      >
        <Card sx={{ ...aeroGlassStyle, borderTop: '3px solid #EB0A1E', position: 'relative', overflow: 'hidden' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#cbd5e1', fontWeight: 700, letterSpacing: 1 }}>
                KRİTİK AKTİF ANDON
              </Typography>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#ff4d5a', textShadow: '0 0 20px rgba(235,10,30,0.45)' }}>
                {openCritical}
              </Typography>
            </Box>
            <ReportProblemIcon sx={{ fontSize: 54, color: 'rgba(235, 10, 30, 0.35)' }} />
          </CardContent>
        </Card>

        <Card sx={{ ...aeroGlassStyle, borderTop: '3px solid #f59e0b' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#cbd5e1', fontWeight: 700, letterSpacing: 1 }}>
                UYARI SEVİYESİ (AKTİF)
              </Typography>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#fbbf24', textShadow: '0 0 20px rgba(245,158,11,0.4)' }}>
                {openWarning}
              </Typography>
            </Box>
            <WarningAmberIcon sx={{ fontSize: 54, color: 'rgba(245, 158, 11, 0.35)' }} />
          </CardContent>
        </Card>

        <Card sx={{ ...aeroGlassStyle, borderTop: '3px solid #22c55e' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3 }}>
            <Box>
              <Typography variant="overline" sx={{ color: '#cbd5e1', fontWeight: 700, letterSpacing: 1 }}>
                ÇÖZÜLEN ARIZALAR
              </Typography>
              <Typography variant="h3" fontWeight="800" sx={{ color: '#4ade80', textShadow: '0 0 20px rgba(34,197,94,0.4)' }}>
                {resolvedCount}
              </Typography>
            </Box>
            <VerifiedIcon sx={{ fontSize: 54, color: 'rgba(34, 197, 94, 0.35)' }} />
          </CardContent>
        </Card>
      </Box>

      {/* Filtre Çubuğu */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2.5 }}>
        <Typography variant="h6" fontWeight="700" sx={{ letterSpacing: 0.3 }}>
          Üretim Hattı Telemetri & Andon Akışı
        </Typography>
        <ToggleButtonGroup
          value={filter}
          exclusive
          onChange={(_, val) => val && setFilter(val)}
          size="small"
          sx={{
            ...aeroGlassStyle,
            borderRadius: '10px',
            '& .MuiToggleButton-root': { color: '#cbd5e1', border: 'none', px: 2 },
            '& .Mui-selected': { bgcolor: 'rgba(235, 10, 30, 0.25) !important', color: '#fff !important', fontWeight: 'bold' },
          }}
        >
          <ToggleButton value="ALL">Tümü ({alerts.length})</ToggleButton>
          <ToggleButton value="OPEN">Açık ({openCritical + openWarning})</ToggleButton>
          <ToggleButton value="RESOLVED">Çözülen ({resolvedCount})</ToggleButton>
        </ToggleButtonGroup>
      </Stack>

      {/* Aero Glass Tablo */}
      <TableContainer component={Paper} sx={{ ...aeroGlassStyle, borderRadius: '16px', overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }}>İSTASYON</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }}>ARAÇ VIN</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }}>SEVİYE</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }}>AÇIKLAMA & AI KÖK NEDEN ÖNERİSİ</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }}>DURUM</TableCell>
              <TableCell sx={{ fontWeight: 'bold', color: '#94a3b8' }} align="right">İŞLEM</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredAlerts.map((alert) => (
              <TableRow
                key={alert.id}
                hover
                sx={{
                  transition: 'background 0.2s ease',
                  '&:hover': { background: 'rgba(255, 255, 255, 0.06) !important' },
                  borderLeft: alert.status === 'OPEN'
                    ? `4px solid ${alert.severity === 'CRITICAL' ? '#EB0A1E' : '#f59e0b'}`
                    : '4px solid #22c55e',
                }}
              >
                <TableCell>
                  <Typography fontWeight="bold" color="white">{alert.stationCode}</Typography>
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: '#cbd5e1', letterSpacing: 0.5 }}>
                  {alert.vehicleVin}
                </TableCell>
                <TableCell>
                  <Chip
                    icon={<WarningAmberIcon />}
                    label={alert.severity}
                    color={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                    size="small"
                    sx={{ fontWeight: 'bold', backdropFilter: 'blur(6px)' }}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="600" color="#f8fafc">
                    {alert.description}
                  </Typography>
                  {alert.aiRecommendation && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.7, color: '#7dd3fc' }}>
                      <SmartToyIcon fontSize="small" />
                      <Typography variant="caption" sx={{ fontSize: '0.8rem' }}>
                        {alert.aiRecommendation}
                      </Typography>
                    </Stack>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={alert.status}
                    color={alert.status === 'RESOLVED' ? 'success' : 'default'}
                    variant={alert.status === 'OPEN' ? 'outlined' : 'filled'}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={loadingReportId === alert.id}
                      startIcon={
                        loadingReportId === alert.id
                          ? <CircularProgress size={14} color="inherit" />
                          : <AutoFixHighIcon fontSize="small" />
                      }
                      onClick={() => handleGenerateReport(alert)}
                      sx={{
                        borderColor: 'rgba(125, 211, 252, 0.45)',
                        color: '#7dd3fc',
                        fontSize: '0.72rem',
                        fontWeight: 'bold',
                        textTransform: 'none',
                        borderRadius: '8px',
                        whiteSpace: 'nowrap',
                        '&:hover': { borderColor: '#7dd3fc', bgcolor: 'rgba(56, 189, 248, 0.12)' },
                      }}
                    >
                      {loadingReportId === alert.id ? 'Oluşturuluyor...' : '5-Why Rapor'}
                    </Button>

                    {kaizenReports[alert.id] && (
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<PictureAsPdfIcon fontSize="small" />}
                        onClick={() => handleDownloadPdf(alert, kaizenReports[alert.id])}
                        sx={{
                          bgcolor: '#EB0A1E',
                          fontSize: '0.72rem',
                          fontWeight: 'bold',
                          textTransform: 'none',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                          '&:hover': { bgcolor: '#c50819' },
                        }}
                      >
                        PDF İndir
                      </Button>
                    )}

                    {alert.status === 'OPEN' ? (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleResolve(alert.id)}
                        sx={{
                          fontWeight: 'bold',
                          borderRadius: '8px',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 14px rgba(34, 197, 94, 0.35)',
                        }}
                      >
                        Çözüldü
                      </Button>
                    ) : (
                      <Typography variant="caption" color="#4ade80" fontWeight="bold" sx={{ pl: 1, whiteSpace: 'nowrap' }}>
                        ✓ Kapatıldı
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

function ManualTriggerPage() {
  const [stationCode, setStationCode] = useState('WELD-01');
  const [vehicleVin, setVehicleVin] = useState('NMTBZ3BE00R999001');
  const [severity, setSeverity] = useState('CRITICAL');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post(API_URL, {
      stationCode,
      vehicleVin,
      severity,
      description,
      aiRecommendation: 'AI Analizi: Manuel operatör bildirimi alındı, ilgili istasyon bakım ekibine öncelikli atandı.'
    });
    setSubmitted(true);
    setDescription('');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Paper sx={{ ...aeroGlassStyle, p: 4, borderTop: '3px solid #EB0A1E' }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Manuel Andon İpi Çek
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Üretim hattında tespit edilen bir kalite veya ekipman sorununu anında kontrol merkezine bildirin.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField select label="İstasyon" value={stationCode} onChange={(e) => setStationCode(e.target.value)} fullWidth>
              <MenuItem value="WELD-01">WELD-01 (Kaynak Hattı)</MenuItem>
              <MenuItem value="PAINT-03">PAINT-03 (Boya Fırını)</MenuItem>
              <MenuItem value="TORQUE-02">TORQUE-02 (Tork Sıkma)</MenuItem>
              <MenuItem value="ASSEMBLY-04">ASSEMBLY-04 (Son Montaj)</MenuItem>
            </TextField>
            <TextField label="Araç Şasi (VIN)" value={vehicleVin} onChange={(e) => setVehicleVin(e.target.value)} required fullWidth />
            <TextField select label="Aciliyet Seviyesi" value={severity} onChange={(e) => setSeverity(e.target.value)} fullWidth>
              <MenuItem value="WARNING">WARNING (Uyarı)</MenuItem>
              <MenuItem value="CRITICAL">CRITICAL (Hattı Durdur)</MenuItem>
            </TextField>
            <TextField label="Arıza Açıklaması" value={description} onChange={(e) => setDescription(e.target.value)} required multiline rows={3} fullWidth />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              sx={{ fontWeight: 'bold', py: 1.5, boxShadow: '0 6px 20px rgba(235, 10, 30, 0.45)' }}
            >
              ANDON UYARISI GÖNDER
            </Button>
            {submitted && (
              <Typography color="#4ade80" fontWeight="bold">
                ✓ Uyarı başarıyla üretim panosuna iletildi!
              </Typography>
            )}
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}

function NavigationBar() {
  const location = useLocation();
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'rgba(10, 14, 24, 0.65)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.35)',
      }}
    >
      <Toolbar sx={{ gap: 2, py: 0.8 }}>
        <ToyotaLogo />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="800" sx={{ letterSpacing: 0.8, lineHeight: 1.1 }}>
            TOYOTA <span style={{ color: '#EB0A1E' }}>|</span> KaizenPulse
          </Typography>
          <Typography variant="caption" sx={{ color: '#94a3b8' }}>
            Sakarya Üretim Hattı Dijital Andon Merkezi
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{
            mr: 1,
            px: 1.8,
            py: 0.6,
            background: 'rgba(34, 197, 94, 0.12)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: '20px',
          }}
        >
          <span className="live-dot" />
          <Typography variant="caption" sx={{ color: '#4ade80', fontWeight: 700, letterSpacing: 0.5 }}>
            CANLI AKIŞ
          </Typography>
        </Stack>

        <Button
          color={location.pathname === '/' ? 'primary' : 'inherit'}
          variant={location.pathname === '/' ? 'contained' : 'text'}
          component={Link}
          to="/"
          sx={{ fontWeight: 'bold', borderRadius: '10px', px: 2 }}
        >
          Canlı Pano
        </Button>
        <Button
          color={location.pathname === '/trigger' ? 'primary' : 'inherit'}
          variant={location.pathname === '/trigger' ? 'contained' : 'text'}
          component={Link}
          to="/trigger"
          sx={{ fontWeight: 'bold', borderRadius: '10px', px: 2 }}
        >
          Manuel Andon
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={toyotaAeroTheme}>
      <CssBaseline />
      <BrowserRouter>
        <NavigationBar />
        <Container maxWidth="xl">
          <Routes>
            <Route path="/" element={<LiveDashboard />} />
            <Route path="/trigger" element={<ManualTriggerPage />} />
          </Routes>
        </Container>
      </BrowserRouter>
    </ThemeProvider>
  );
}