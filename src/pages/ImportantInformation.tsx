import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Alert,
  Button,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  LinearProgress,
} from '@mui/material';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type Guide = {
  id: string;
  title: string;
  description: string;
  important: string;
  before: string[];
  during: string[];
  after: string[];
  source: string;
};

const guides: Guide[] = [
  {
    id: 'lluvias',
    title: 'Lluvias e inundaciones',
    description:
      'Recomendaciones para reducir riesgos frente a lluvias intensas, anegamientos e inundaciones.',
    important:
      'Nunca circules por calles inundadas. El agua puede ocultar pozos, cables, corrientes u otros peligros.',
    before: [
      'Conocé los lugares de evacuación y los sitios elevados de tu zona.',
      'Mantené preparada tu mochila o kit de emergencia.',
      'Retirá objetos que puedan impedir el escurrimiento del agua.',
      'Mantené documentos y elementos importantes protegidos del agua.',
    ],
    during: [
      'Evitá circular por calles inundadas o afectadas.',
      'Alejate de zonas costeras y ribereñas.',
      'No te refugies debajo de postes o cables eléctricos.',
      'Si existe riesgo de ingreso de agua a la vivienda, cortá el suministro eléctrico si es seguro hacerlo.',
      'Mantenete bajo techo y seguí las indicaciones de las autoridades.',
    ],
    after: [
      'No ingreses a zonas afectadas hasta que sean consideradas seguras.',
      'Prestá atención a cables, estructuras dañadas y agua acumulada.',
      'Seguí informándote mediante organismos oficiales.',
    ],
    source:
      'https://www.argentina.gob.ar/sinagir/riesgos-frecuentes/lluvias-intensas/que-hacer',
  },

  {
    id: 'tormentas',
    title: 'Tormentas fuertes',
    description:
      'Medidas básicas de protección frente a tormentas eléctricas, fuertes lluvias y vientos.',
    important:
      'Durante una tormenta fuerte, priorizá permanecer en un lugar seguro y evitá exponerte innecesariamente.',
    before: [
      'Consultá los alertas meteorológicos oficiales.',
      'Asegurá objetos que puedan ser desplazados por el viento.',
      'Prepará linterna, documentación y elementos básicos.',
      'Planificá dónde refugiarte si las condiciones empeoran.',
    ],
    during: [
      'Evitá la circulación exterior.',
      'Si estás afuera, buscá un lugar seguro y cerrado.',
      'Si estás viajando y no podés llegar a un refugio seguro, permanecé atento a las recomendaciones oficiales.',
      'Alejate de postes, árboles, estructuras inestables y zonas inundables.',
      'En zonas costeras o balnearios, abandoná espacios abiertos ante tormentas eléctricas.',
    ],
    after: [
      'Esperá a que las condiciones sean seguras antes de salir.',
      'Evitá cables caídos, árboles dañados y calles anegadas.',
      'Comprobá si existen nuevas advertencias o alertas oficiales.',
    ],
    source:
      'https://www.argentina.gob.ar/noticias/sinagir-recomienda-que-hacer-en-caso-de-tormentas',
  },

  {
    id: 'incendios',
    title: 'Incendios forestales',
    description:
      'Prevención y actuación frente a incendios en bosques, campos y pastizales.',
    important:
      'Si la autoridad ordena evacuar, hacelo inmediatamente y respetá las indicaciones de los equipos de emergencia.',
    before: [
      'No hagas fuego fuera de lugares habilitados.',
      'Nunca pierdas de vista un fuego encendido.',
      'Evitá arrojar colillas, fósforos o elementos calientes.',
      'Si vivís cerca de bosques o campos, mantené despejado el entorno de la vivienda.',
    ],
    during: [
      'Evacuá el área si existe peligro.',
      'Mantenete informado sobre el comportamiento y avance del incendio.',
      'Seguí las rutas e indicaciones establecidas por las autoridades.',
      'Reducí la exposición al humo durante la evacuación.',
    ],
    after: [
      'No regreses a áreas quemadas hasta que sean declaradas seguras.',
      'Recordá que algunos puntos calientes pueden reactivarse.',
      'Continuá respetando las indicaciones de las autoridades.',
    ],
    source:
      'https://www.argentina.gob.ar/servicio-nacional-de-manejo-del-fuego/recomendaciones-para-prevenir-incendios-forestales',
  },

  {
    id: 'plan',
    title: 'Plan familiar',
    description:
      'Preparación para que cada integrante del hogar sepa cómo actuar ante una emergencia.',
    important:
      'Un plan preparado antes de una emergencia reduce la improvisación cuando cada minuto importa.',
    before: [
      'Identificá los principales riesgos dentro y fuera de tu vivienda.',
      'Definí una ruta para abandonar la casa.',
      'Elegí un punto de encuentro familiar.',
      'Identificá una zona segura cercana.',
      'Asigná responsabilidades a cada integrante.',
      'Considerá especialmente a niños, adultos mayores, personas con discapacidad y mascotas.',
    ],
    during: [
      'Aplicá el plan acordado previamente.',
      'Evitá separarte del grupo sin necesidad.',
      'Priorizá a las personas que necesitan asistencia.',
      'Seguí las indicaciones oficiales de evacuación.',
    ],
    after: [
      'Reunite en el punto previamente establecido.',
      'Confirmá que todos los integrantes estén a salvo.',
      'Revisá qué aspectos del plan funcionaron y cuáles deberían mejorarse.',
    ],
    source:
      'https://www.argentina.gob.ar/sinagir/plan-familiar-de-emergencias',
  },
];

const emergencyKit = [
  'Documentación protegida',
  'Agua potable',
  'Botiquín de primeros auxilios',
  'Linterna con pilas',
  'Silbato',
  'Teléfonos útiles',
  'Artículos de higiene',
  'Alimentos no perecederos',
  'Medicamentos recetados',
  'Abrigo y mantas',
  'Dinero',
  'Llaves de vivienda y vehículo',
];

const alertLevels = [
  {
    name: 'Verde',
    action: 'Tranquilidad',
    description: 'No se esperan fenómenos meteorológicos que impliquen riesgos.',
    color: '#2e7d32',
    background: '#eef8f0',
  },
  {
    name: 'Amarillo',
    action: 'Informate',
    description:
      'Pueden producirse fenómenos con capacidad de daño o interrupciones momentáneas de actividades.',
    color: '#9a7600',
    background: '#fff9df',
  },
  {
    name: 'Naranja',
    action: 'Preparate',
    description:
      'Se esperan fenómenos peligrosos para la sociedad, la vida, los bienes y el ambiente.',
    color: '#c75b00',
    background: '#fff3e8',
  },
  {
    name: 'Rojo',
    action: 'Seguí instrucciones oficiales',
    description:
      'Se esperan fenómenos excepcionales con potencial de provocar emergencias o desastres.',
    color: '#b90014',
    background: '#fff0f2',
  },
];

export default function ImportantInformation() {
  const [selectedGuide, setSelectedGuide] = useState('lluvias');

  const [checkedKit, setCheckedKit] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('emergency-kit');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(
      'emergency-kit',
      JSON.stringify(checkedKit)
    );
  }, [checkedKit]);

  const guide = useMemo(
    () => guides.find((item) => item.id === selectedGuide) || guides[0],
    [selectedGuide]
  );

  const progress = Math.round(
    (checkedKit.length / emergencyKit.length) * 100
  );

  const toggleKitItem = (item: string) => {
    setCheckedKit((current) =>
      current.includes(item)
        ? current.filter((value) => value !== item)
        : [...current, item]
    );
  };

  return (
    <Box sx={{ pb: 6 }}>

      {/* CABECERA */}
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 4,
          background:
            'linear-gradient(135deg, #8f0010 0%, #b90014 55%, #d7192d 100%)',
          color: '#fff',
          p: {
            xs: 3,
            sm: 4,
            md: 5,
          },
          mb: 4,
          boxShadow: '0 14px 35px rgba(185,0,20,0.20)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            width: 350,
            height: 350,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.06)',
            right: -120,
            top: -170,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            width: 180,
            height: 180,
            borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.04)',
            right: 180,
            bottom: -120,
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box
            sx={{
              width: 54,
              height: 54,
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2.5,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 30 }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              mb: 1,
            }}
          >
            Información y Prevención
          </Typography>

          <Typography
            sx={{
              maxWidth: 760,
              fontSize: {
                xs: '15px',
                md: '17px',
              },
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Prepararte antes de una emergencia puede marcar una gran
            diferencia. Consultá recomendaciones, prepará tu kit y conocé cómo
            actuar ante distintos riesgos.
          </Typography>
        </Box>
      </Box>

      {/* MENSAJE IMPORTANTE */}
      <Alert
        severity="warning"
        icon={<WarningAmberOutlinedIcon />}
        sx={{
          mb: 4,
          borderRadius: 3,
          alignItems: 'center',
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Typography sx={{ fontWeight: 700 }}>
          Ante una emergencia real
        </Typography>

        <Typography variant="body2">
          Priorizá tu seguridad y seguí siempre las instrucciones de las
          autoridades y organismos oficiales.
        </Typography>
      </Alert>

      {/* GUÍAS */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h5"
          sx={{
            color: '#001d32',
            fontWeight: 800,
            mb: 1,
          }}
        >
          ¿Sobre qué necesitás informarte?
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Elegí una situación para consultar recomendaciones específicas.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.2,
            mb: 3,
          }}
        >
          {guides.map((item) => {
            const selected = item.id === selectedGuide;

            return (
              <Chip
                key={item.id}
                label={item.title}
                clickable
                onClick={() => setSelectedGuide(item.id)}
                sx={{
                  height: 42,
                  px: 1,
                  fontWeight: selected ? 700 : 500,
                  bgcolor: selected ? '#b90014' : '#fff',
                  color: selected ? '#fff' : '#263238',
                  border: '1px solid',
                  borderColor: selected ? '#b90014' : '#e0e4e8',
                  transition: 'all 0.2s ease',

                  '&:hover': {
                    bgcolor: selected ? '#9f0011' : '#fff5f6',
                    borderColor: '#b90014',
                  },
                }}
              />
            );
          })}
        </Box>

        <Card
          sx={{
            borderRadius: 3,
            border: '1px solid #e4e8ec',
            boxShadow: '0 8px 28px rgba(0, 29, 50, 0.06)',
            overflow: 'hidden',
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 2.5,
                md: 4,
              },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 2,
                flexWrap: 'wrap',
                mb: 3,
              }}
            >
              <Box>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#001d32',
                    mb: 0.7,
                  }}
                >
                  {guide.title}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    maxWidth: 700,
                    lineHeight: 1.6,
                  }}
                >
                  {guide.description}
                </Typography>
              </Box>

              <Chip
                label="Guía de prevención"
                sx={{
                  bgcolor: '#fbeaec',
                  color: '#b90014',
                  fontWeight: 700,
                }}
              />
            </Box>

            <Alert
              severity="info"
              sx={{
                borderRadius: 2,
                mb: 3,
              }}
            >
              <strong>Recordá:</strong> {guide.important}
            </Alert>

            <Accordion
              defaultExpanded
              disableGutters
              sx={{
                boxShadow: 'none',
                border: '1px solid #e8eaed',
                borderRadius: '12px !important',
                mb: 1.5,
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>
                  Antes de la emergencia
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {guide.before.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex',
                      gap: 1.2,
                      mb: 1.3,
                    }}
                  >
                    <CheckCircleOutlinedIcon
                      sx={{
                        color: '#b90014',
                        fontSize: 20,
                        mt: '2px',
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            <Accordion
              disableGutters
              sx={{
                boxShadow: 'none',
                border: '1px solid #e8eaed',
                borderRadius: '12px !important',
                mb: 1.5,
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>
                  Durante la emergencia
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {guide.during.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex',
                      gap: 1.2,
                      mb: 1.3,
                    }}
                  >
                    <WarningAmberOutlinedIcon
                      sx={{
                        color: '#b90014',
                        fontSize: 20,
                        mt: '2px',
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            <Accordion
              disableGutters
              sx={{
                boxShadow: 'none',
                border: '1px solid #e8eaed',
                borderRadius: '12px !important',
                overflow: 'hidden',
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography sx={{ fontWeight: 700 }}>
                  Después de la emergencia
                </Typography>
              </AccordionSummary>

              <AccordionDetails>
                {guide.after.map((item) => (
                  <Box
                    key={item}
                    sx={{
                      display: 'flex',
                      gap: 1.2,
                      mb: 1.3,
                    }}
                  >
                    <CheckCircleOutlinedIcon
                      sx={{
                        color: '#2e7d32',
                        fontSize: 20,
                        mt: '2px',
                      }}
                    />

                    <Typography
                      variant="body2"
                      sx={{ lineHeight: 1.6 }}
                    >
                      {item}
                    </Typography>
                  </Box>
                ))}
              </AccordionDetails>
            </Accordion>

            <Box
              sx={{
                mt: 3,
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <Button
                component="a"
                href={guide.source}
                target="_blank"
                rel="noreferrer"
                variant="outlined"
                sx={{
                  borderColor: '#b90014',
                  color: '#b90014',
                  borderRadius: 2,
                  fontWeight: 700,
                  textTransform: 'none',

                  '&:hover': {
                    borderColor: '#9f0011',
                    bgcolor: '#fff5f6',
                  },
                }}
              >
                Consultar fuente oficial
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* ALERTAS SMN */}
      <Box sx={{ mb: 5 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            color: '#001d32',
            mb: 1,
          }}
        >
          Entendé los niveles de alerta
        </Typography>

        <Typography
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Los colores permiten reconocer rápidamente el nivel de riesgo
          meteorológico.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: '1fr 1fr',
              lg: 'repeat(4, 1fr)',
            },
            gap: 2,
          }}
        >
          {alertLevels.map((level) => (
            <Card
              key={level.name}
              sx={{
                borderRadius: 3,
                border: '1px solid #e4e8ec',
                borderTop: `5px solid ${level.color}`,
                bgcolor: level.background,
                boxShadow: 'none',
                transition: '0.2s ease',

                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                },
              }}
            >
              <CardContent>
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: '18px',
                    color: level.color,
                    mb: 0.3,
                  }}
                >
                  {level.name}
                </Typography>

                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: '13px',
                    textTransform: 'uppercase',
                    mb: 1.5,
                  }}
                >
                  {level.action}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    lineHeight: 1.6,
                  }}
                >
                  {level.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

      {/* KIT DE EMERGENCIA */}
      <Card
        sx={{
          borderRadius: 3,
          border: '1px solid #e4e8ec',
          boxShadow: '0 8px 28px rgba(0,29,50,0.06)',
          mb: 5,
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              md: 4,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: {
                xs: 'flex-start',
                sm: 'center',
              },
              flexDirection: {
                xs: 'column',
                sm: 'row',
              },
              gap: 2,
              mb: 2,
            }}
          >
            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  color: '#001d32',
                  mb: 0.7,
                }}
              >
                Tu kit de emergencia
              </Typography>

              <Typography color="text.secondary">
                Marcá los elementos que ya tenés preparados.
              </Typography>
            </Box>

            <Chip
              label={`${checkedKit.length} de ${emergencyKit.length}`}
              sx={{
                bgcolor:
                  progress === 100
                    ? '#e7f6ea'
                    : '#fbeaec',
                color:
                  progress === 100
                    ? '#267337'
                    : '#b90014',
                fontWeight: 800,
              }}
            />
          </Box>

          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 9,
              borderRadius: 10,
              bgcolor: '#edf0f2',
              mb: 1,
              '& .MuiLinearProgress-bar': {
                bgcolor:
                  progress === 100
                    ? '#2e7d32'
                    : '#b90014',
              },
            }}
          />

          <Typography
            variant="caption"
            color="text.secondary"
          >
            {progress}% preparado
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: '1fr 1fr',
                md: 'repeat(3, 1fr)',
              },
              gap: 1,
            }}
          >
            {emergencyKit.map((item) => (
              <FormControlLabel
                key={item}
                control={
                  <Checkbox
                    checked={checkedKit.includes(item)}
                    onChange={() => toggleKitItem(item)}
                    sx={{
                      '&.Mui-checked': {
                        color: '#b90014',
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    {item}
                  </Typography>
                }
              />
            ))}
          </Box>

          <Box
            sx={{
              mt: 3,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Tu progreso se guarda automáticamente en este dispositivo.
            </Typography>

            {checkedKit.length > 0 && (
              <Button
                onClick={() => setCheckedKit([])}
                size="small"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                }}
              >
                Reiniciar lista
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* SEGURIDAD PARA VOLUNTARIOS */}
      <Card
        sx={{
          borderRadius: 3,
          bgcolor: '#001d32',
          color: '#fff',
          overflow: 'hidden',
        }}
      >
        <CardContent
          sx={{
            p: {
              xs: 3,
              md: 4,
            },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start',
            }}
          >
            <Box
              sx={{
                width: 50,
                height: 50,
                flexShrink: 0,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocalHospitalOutlinedIcon />
            </Box>

            <Box>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 1,
                }}
              >
                Ayudar también implica cuidarse
              </Typography>

              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.78)',
                  lineHeight: 1.7,
                  maxWidth: 800,
                }}
              >
                No ingreses por cuenta propia a una zona peligrosa ni realices
                tareas para las que no estás preparado. La ayuda voluntaria es
                más efectiva cuando se realiza de forma organizada y siguiendo
                las indicaciones de quienes coordinan la emergencia.
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* FUENTES */}
      <Box
        sx={{
          mt: 5,
          textAlign: 'center',
        }}
      >
        <HomeOutlinedIcon
          sx={{
            color: '#b90014',
            mb: 1,
          }}
        />

        <Typography
          sx={{
            fontWeight: 700,
            mb: 0.5,
          }}
        >
          Información basada en organismos oficiales
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
        >
          Consultá siempre las comunicaciones actuales de las autoridades ante
          una situación real.
        </Typography>
      </Box>
    </Box>
  );
}