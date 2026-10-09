import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font, Svg, G, Path, Rect, Polygon } from '@react-pdf/renderer';

// Registro de fuente estándar
Font.register({
  family: 'Open Sans',
  fonts: [
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-regular.ttf' },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-700.ttf', fontWeight: 700 },
    { src: 'https://cdn.jsdelivr.net/npm/open-sans-all@0.1.3/fonts/open-sans-italic.ttf', fontStyle: 'italic' }
  ]
});

const styles = StyleSheet.create({
  page: { backgroundColor: '#F9F8F4', paddingTop: 40, paddingBottom: 60, paddingHorizontal: 40, fontFamily: 'Open Sans' },
  headerImage: { height: 260, marginLeft: -40, marginRight: -40, marginTop: -40, objectFit: 'cover' },
  titleBox: { backgroundColor: '#005333', padding: 25, marginTop: -40, borderRadius: 12 },
  title: { fontSize: 32, color: '#FFFFFF', fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#D4AF37', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 2 },
  sectionTitle: { fontSize: 22, color: '#005333', fontWeight: 'bold', marginTop: 30, marginBottom: 15, borderBottom: '2pt solid #D4AF37', paddingBottom: 5 },
  text: { fontSize: 12, color: '#2D2D2D', lineHeight: 1.6, marginBottom: 10 },
  boldText: { fontWeight: 'bold', color: '#005333' },
  bullet: { flexDirection: 'row', marginBottom: 8 },
  bulletDot: { width: 15, fontSize: 12, color: '#D4AF37', fontWeight: 'bold' },
  bulletText: { flex: 1, fontSize: 12, color: '#2D2D2D', lineHeight: 1.5 },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 20 },
  imageGridItem: { width: '48%', height: 160, borderRadius: 10, objectFit: 'cover', marginBottom: 15 },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, borderTop: '1pt solid #D4AF37', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 10, color: '#666666' },
  disclaimer: { backgroundColor: '#D4AF37', padding: 20, borderRadius: 10, marginTop: 35, marginBottom: 20 },
  
  // Estilos para Planes y Testimonios
  planBox: { backgroundColor: '#FFFFFF', border: '1pt solid #D4AF37', borderRadius: 10, padding: 15, marginBottom: 12 },
  planTitleBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  planTitle: { fontSize: 14, fontWeight: 'bold', color: '#005333' },
  planBadge: { backgroundColor: '#D4AF37', color: '#005333', fontSize: 9, fontWeight: 'bold', paddingVertical: 2, paddingHorizontal: 6, borderRadius: 10, marginLeft: 10, textTransform: 'uppercase' },
  planDesc: { fontSize: 11, color: '#4A4A4A', lineHeight: 1.5 },
  quoteBox: { backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: 15, borderRadius: 10, borderLeft: '4pt solid #005333', marginBottom: 12 },
  quoteText: { fontSize: 11, fontStyle: 'italic', color: '#2D2D2D', marginBottom: 6, lineHeight: 1.4 },
  quoteAuthor: { fontSize: 10, fontWeight: 'bold', color: '#005333' },
  
  // Estilos para Logos de Instituciones en Imagen
  institutionsFlexBox: { flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10, marginBottom: 20, justifyContent: 'center', alignItems: 'center' },
  institutionLogoBox: { backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, border: '1pt solid #EAEAEA', alignItems: 'center', justifyContent: 'center', width: 60, height: 60 },
  logoImg: { width: 44, height: 44, objectFit: 'contain' }
});

const BulletPoint = ({ children }: { children: React.ReactNode }) => (
  // Mantenemos wrap={false} solo en viñetas para que no se parta individualmente
  <View style={styles.bullet} wrap={false}>
    <Text style={styles.bulletDot}>•</Text>
    <Text style={styles.bulletText}>{children}</Text>
  </View>
);

// Componente Inline para el Logo de Racing Club en Vector garantizando la carga
const RacingLogo = () => (
  <Svg viewBox="0 0 595 726" style={{ width: 44, height: 44 }}>
    <G>
      <Path fillRule="evenodd" fill="#00A1DF" d="M9.239,560.006c0.028,0.043,1.036,11.485,1.303,12.76 c0.884,4.214,1.417,7.344,2.404,11.341c1.628,6.601,5.293,14.257,8.62,19.187c6.573,9.742,19.134,20.375,31.087,24.522 c3.581,1.243,6.29,2.463,10.392,3.67c3.483,1.025,7.42,1.901,10.782,2.96c4.126,1.3,18.987,3.698,23.94,3.863 c3.379,0.112,8.88,0.946,12.762,1.299c1.669,0.152,4.416,0.429,6.273,0.758c2.078,0.368,4.26,0.01,6.327,0.384 c3.046,0.551,9.824,1.099,12.975,1.087c4.604-0.018,8.264,0.984,12.782,0.958c4.514-0.025,8.851,1.238,12.771,1.292 c3.414,0.045,9.498,0.647,12.554,1.187c7.88,1.387,16.561,2.075,23.887,3.916c6.91,1.733,16.049,3.099,22.185,5.617 c6.932,2.845,13.574,4.498,20.002,7.801c5.576,2.862,12.937,6.416,17.767,10.039c2.792,2.093,5.263,3.938,8.024,6.037 c2.694,2.048,4.72,4.461,7.2,6.543c9.873,8.288,16.946,20.566,24.204,31.408h0.318c3.604-5.382,6.786-10.925,10.669-16.18 c3.896-5.274,8.017-9.702,12.58-14.267c9.414-9.416,18.736-15.791,31.297-22.075c12.002-6.004,25.239-10.463,40.238-13.45 c13.541-2.694,31.938-5.793,47.426-5.94c4.001-0.039,7.96-0.673,12.775-0.647c3.61,0.02,8.887-0.346,12.785-0.638 c4.136-0.31,8.22-0.642,12.779-0.642c4.607,0,8.672-0.651,12.786-0.635c11.852,0.047,38.206-3.287,47.081-6.288 c13.386-4.528,26.259-9.603,33.892-19.8c4.081-5.452,7.453-9.723,9.883-16.963c1.344-4.005,1.741-6.242,2.632-10.795 c0.367-1.879,0.878-3.886,1.074-5.637c0.207-1.837-0.463-4.781,0.342-6.051V7.973H9.239V560.006z" />
      <Rect x="23.619" y="22.357" fillRule="evenodd" fill="#FDFEFF" width="548.037" height="101.968" />
      <Path fillRule="evenodd" fill="#FDFEFF" d="M256.255,653.982c0,0.907,9.88,6.901,11.309,7.868 c3.956,2.679,7.4,5.476,10.979,8.518c3.369,2.863,17.69,16.903,18.616,20.373c0.489-0.13,14.822-16.564,18.087-18.986 c3.487-2.586,6.554-5.719,10.155-8.381c1.463-1.081,11.063-6.818,11.063-7.793V139.029h-80.209V653.982z" />
      <Path fillRule="evenodd" fill="#FDFEFF" d="M416.992,632.246c2.839,0,6.628-0.643,9.555-0.989 c2.909-0.345,6.875-0.205,9.812-0.736c3.726-0.674,16.293-1.177,20.254-1.155c13.304,0.074,27.621-1.914,40.588-1.914V139.029 h-80.208V632.246z" />
      <Polygon fillRule="evenodd" fill="#FDFEFF" points="94.879,623.615 175.408,630.968 175.408,139.029 94.879,139.029" />
      <Path fillRule="evenodd" fill="#00A1DF" d="M418.609,116.63h18.532V82.428h5.753 c12.869,0,14.366,7.581,20.373,14.462c1.977,2.264,13.812,19.74,15.097,19.74h21.411c-0.152-0.576-12.052-18.152-13.357-19.881 c-2.193-2.905-4.922-6.658-7.324-9.296c-2.007-2.204-8.89-6.19-9.676-7.262c11.256-0.937,23.007-9.189,23.007-21.097v-4.156 c0-3.339-2.292-8.534-3.773-10.607c-2.603-3.64-3.964-4.352-7.666-6.718c-5-3.199-16.901-3.451-25.31-3.451h-37.066V116.63z" />
      <Path fillRule="evenodd" fill="#00A1DF" d="M250.994,114.575l19.619-0.075l7.224-18.784h35.151 c0.901,0,4.037,7.892,4.406,9.018c0.799,2.444,3.741,7.925,3.9,9.841h20.451c-3.025-5.718-6.541-14.356-9.073-20.649 c-2.766-6.869-6.14-13.913-9.143-20.583c-3.08-6.837-6.083-13.735-9.049-20.675c-1.581-3.697-2.855-6.874-4.54-10.482 c-0.679-1.45-3.973-10.08-4.944-10.08h-18.212c-1.371,0-4.331,8.089-4.985,9.717c-1.473,3.656-2.966,6.768-4.451,10.253 c-3.066,7.211-5.808,13.919-8.784,20.94c-1.21,2.856-2.923,7.756-4.357,10.345c-1.148,2.07-3.592,7.947-4.403,10.299 c-1.167,3.378-3.117,6.879-4.375,10.327C254.27,107.163,251.756,111.302,250.994,114.575z" />
      <Path fillRule="evenodd" fill="#00A1DF" d="M94.563,76.948c0,23.917,15.462,42.194,38.985,42.194h4.475 c18.771,0,31.946-11.721,35.432-26.723l-18.177-5.243c-0.335,4.027-3.106,8.949-5.195,11.426 c-1.861,2.207-7.346,5.806-11.097,5.841c-5.831,0.057-9.743,0.271-14.008-2.299c-3.825-2.307-6.201-4.569-8.269-8.671 c-0.899-1.784-1.531-4.366-1.941-6.369c-0.625-3.048-0.308-4.847-0.78-7.851c-0.87-5.537,0.471-10.8,1.277-15.16 c1.433-7.746,9.543-15.594,18.284-15.594h4.793c3.951,0,8.615,2.592,10.927,4.413c1.65,1.299,2.3,2.495,3.513,4.158 c0.676,0.926,2.001,5.173,2.497,5.173c1.2,0,7.14-1.685,8.809-2.056c2.924-0.651,6.288-1.546,9.086-1.78 c-2.092-8.98-8.635-16.58-16.197-20.237c-7.798-3.773-20.689-5.708-31.097-3.096C106.697,39.886,94.563,53.161,94.563,76.948z" />
      <Path fillRule="evenodd" fill="#FDFEFF" d="M438.211,68.864h22.688c7.542,0,13.741-2.868,13.741-10.229 c0-5.3-4.496-9.909-9.588-9.909h-26.842V68.864z" />
      <Polygon fillRule="evenodd" fill="#FDFEFF" points="284.934,81.683 308.933,81.607 296.8,51.973" />
    </G>
  </Svg>
);

const DossierAulaVerde = () => (
  <Document>
    {/* UNA ÚNICA PÁGINA 'wrap' PARA QUE EL TEXTO FLUYA DE FORMA CONTINUA SIN ESPACIOS BLANCOS */}
    <Page size="A4" style={styles.page} wrap>
      
      {/* Footer Fijo que se imprimirá en todas las hojas que el PDF genere */}
      <View fixed style={styles.footer}>
        <Text style={styles.footerText}>Pueblo Mágico | Dossier Aula Verde</Text>
        <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>

      <View wrap={false}>
          <Image style={styles.headerImage} src="/uploads/Aula%20Verde/IMG-20251118-WA0085.jpg" />
          <View style={styles.titleBox}>
            <Text style={styles.title}>AULA VERDE</Text>
            <Text style={styles.subtitle}>Propuesta Institucional</Text>
          </View>
      </View>

      <Text style={styles.sectionTitle}>¿Quiénes Somos?</Text>
      <Text style={styles.text}>
        Pueblo Mágico es un ecolodge de montaña en Sierras Grandes, concebido para brindar experiencias vivenciales desconectadas de las pantallas y 100% integradas a la naturaleza, enfocadas en el aprendizaje dinámico y el desarrollo personal grupal.
      </Text>

      <Text style={styles.sectionTitle}>Nuestra Propuesta Diferencial</Text>
      <Text style={styles.text}>
        "Aula Verde" nace para ofrecer a colegios, profesores y coordinadores grupales, un formato de viaje seguro y en un entorno natural montañés, garantizando el confort del grupo para el mejor desempeño didáctico.
      </Text>

      <View style={{ marginTop: 10 }}>
        <BulletPoint><Text style={styles.boldText}>Aprendizaje Experiencial:</Text> Talleres de agroecología, huerta orgánica y fogones de reflexión profunda.</BulletPoint>
        <BulletPoint><Text style={styles.boldText}>Infraestructura Premium:</Text> Salón Octogonal de 100m² para dinámicas cerradas y domos geodésicos herméticos. <Text style={styles.boldText}>Capacidad para delegaciones grandes (hasta 200 personas) preparadas para estancias cortas o extendidas.</Text></BulletPoint>
        <BulletPoint><Text style={styles.boldText}>Seguridad Integral:</Text> Entorno cerrado de exclusividad con acceso apto para todo tipo de buses grandes.</BulletPoint>
      </View>

      <Text style={styles.sectionTitle}>Modalidades de Viaje</Text>
      <Text style={styles.text}>Diseñamos experiencias educativas transformadoras adaptadas a las necesidades específicas y al presupuesto de tu comunidad escolar.</Text>

      <View style={styles.planBox}>
        <View style={styles.planTitleBox}>
          <Text style={styles.planTitle}>1. Eco-Campamento Base</Text>
        </View>
        <Text style={styles.planDesc}>Ideal para instituciones que traen su propio cronograma. Incluye alojamiento exclusivo, uso libre de todas las instalaciones, pensión completa con gastronomía 100% casera y saludable (4 comidas) y asistencia médica base.</Text>
      </View>

      <View style={styles.planBox}>
        <View style={styles.planTitleBox}>
          <Text style={styles.planTitle}>2. Inmersión Educativa</Text>
          <Text style={styles.planBadge}>La más elegida</Text>
        </View>
        <Text style={styles.planDesc}>Todo lo del plan Base, sumando una propuesta pedagógica completa con talleres guiados (huerta, arte, ecología) y acompañamiento constante de nuestro Equipo Anfitrión.</Text>
      </View>

      <View style={styles.planBox}>
        <View style={styles.planTitleBox}>
          <Text style={styles.planTitle}>3. Proyecto a Medida</Text>
        </View>
        <Text style={styles.planDesc}>Perfecto para delegaciones grandes o campamentos extendidos. Trabajamos un diseño curricular conjunto, adaptando la logística, los menús especiales y asegurando la exclusividad total del predio.</Text>
      </View>

      <Text style={styles.sectionTitle}>Cronograma Tipo (Desafío 2 Días)</Text>
      <Text style={styles.text}>A modo de ejemplo. Personalizamos por completo la estructura de horarios dependiendo el nivel madurativo del grupo de alumnos o scouts.</Text>
      
      <View style={{ marginTop: 10 }}>
          <Text style={[styles.boldText, { fontSize: 13, marginBottom: 6 }]}>DÍA 1: Inmersión y Conexión</Text>
          <BulletPoint>10:00 - Llegada fluida de los micros e instalación.</BulletPoint>
          <BulletPoint>11:00 - Asignación de Refugios y pautas principales.</BulletPoint>
          <BulletPoint>15:00 - Taller interactivo guiado: Ecología y vida práctica.</BulletPoint>
          <BulletPoint>20:30 - Cena y armado del gran Fogón Integrador.</BulletPoint>
      </View>

      <View style={{ marginTop: 15 }}>
          <Text style={[styles.boldText, { fontSize: 13, marginBottom: 6 }]}>DÍA 2: Naturaleza y Desafío</Text>
          <BulletPoint>09:30 - Senderismo y exploración segura de vertientes.</BulletPoint>
          <BulletPoint>13:30 - Almuerzo de cierre al disco de arado o parrilla.</BulletPoint>
          <BulletPoint>15:00 - Asamblea final, arte efímero y agradecimientos.</BulletPoint>
      </View>

      <Text style={styles.sectionTitle}>Nuestros Servicios Exclusivos</Text>
      <View style={{ marginTop: 0 }}>
          <BulletPoint><Text style={styles.boldText}>Alojamiento Total:</Text> Camas individuales confortables con baños de amplias duchas con agua caliente 24 hs.</BulletPoint>
          <BulletPoint><Text style={styles.boldText}>Gastronomía Adaptada:</Text> Pensión completa artesanal, con opciones para alumnos celíacos, alérgicos o veganos sin cargo extra. No garantizamos un ambiente 100% libre de contaminación cruzada (cocina y mesada compartidas) — para celiaquía severa, consultanos antes de confirmar.</BulletPoint>
          <BulletPoint><Text style={styles.boldText}>Staff Bonificado:</Text> Coordinadores y docentes acceden al formato de liberados para unirse de acuerdo a cantidad.</BulletPoint>
      </View>

      <Text style={styles.sectionTitle}>Confían en Nosotros</Text>
      <Text style={styles.text}>Un reflejo del amor y la dedicación que todo el equipo de Pueblo Mágico pone en cada visita educacional. Algunas instituciones que nos eligen:</Text>
      
      <View style={styles.institutionsFlexBox}>
        <View style={styles.institutionLogoBox}>
          <Image style={styles.logoImg} src="/uploads/Aula%20Verde/logo_hebraica.png" />
        </View>
        <View style={styles.institutionLogoBox}>
          <Image style={styles.logoImg} src="/uploads/Aula%20Verde/Logos%20escuelas/el%20trigal.png" />
        </View>
        <View style={styles.institutionLogoBox}>
          <Image style={styles.logoImg} src="/uploads/Aula%20Verde/Logos%20escuelas/wladorr%20villa%20Belgrano.png" />
        </View>
        <View style={styles.institutionLogoBox}>
          <Image style={styles.logoImg} src="/uploads/Aula%20Verde/Logos%20escuelas/senshi%20dojo%20unquillo.png" />
        </View>
        <View style={styles.institutionLogoBox}>
          <Image style={styles.logoImg} src="/uploads/Aula%20Verde/Logos%20escuelas/kwu_senshi-removebg-preview.png" />
        </View>
        <View style={styles.institutionLogoBox}>
          <RacingLogo />
        </View>
      </View>

      <View style={styles.quoteBox} wrap={false}>
        <Text style={styles.quoteText}>"Llevamos un grupo de 200 personas. La comida que nos hicieron fue 100% casera, cuidada, con calidad espectacular. Lo que más destaco es la predisposición para tomar el desafío, adaptar los recursos y lograr una propuesta que los chicos no se van a olvidar nunca."</Text>
        <Text style={styles.quoteAuthor}>— Fede, Dir. Juventud (Campamento de 9 días)</Text>
      </View>

      <View style={styles.quoteBox} wrap={false}>
        <Text style={styles.quoteText}>"A los chicos les costó soltar la inercia de la ciudad, pero su resistencia se rindió ante la naturaleza. Tuvimos Desde juegos en el barro hasta la profundidad de un fogón donde la palabra circuló de otra manera. Nos hicieron sentir familia."</Text>
        <Text style={styles.quoteAuthor}>— Alejandro, Coordinador Gral. de Campamentos (Racing de Cba.)</Text>
      </View>

      {/* TEXTO DE DISCLAIMER CORREGIDO PARA ALINEARSE CON LA WEB */}
      <View style={styles.disclaimer} wrap={false}>
        <Text style={{ fontSize: 13, color: '#005333', fontWeight: 'bold', textAlign: 'center', lineHeight: 1.5 }}>
          Los valores de los planes publicados en nuestra plataforma web aplican como tarifas base de referencia. Comunicate hoy mismo para armarte un presupuesto a medida según el volumen de tu institución y la fecha del campamento.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Galería en la Montaña</Text>
      <Text style={styles.text}>Instantáneas reales de la libertad, aprendizaje y risas que se viven desconectados del asfalto.</Text>

      <View style={styles.imageGrid}>
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251120-WA0149.jpg" />
        <Image style={styles.imageGridItem} src="/uploads/469280911_444096748740233_2818770490495002077_n.webp" />
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251118-WA0056.jpg" />
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251120-WA0036.jpg" />
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251120-WA0057.jpg" />
        <Image style={styles.imageGridItem} src="/uploads/469742031_941240881439467_8316347989568757415_n.webp" />
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251120-WA0276.jpg" />
        <Image style={styles.imageGridItem} src="/uploads/Aula%20Verde/IMG-20251120-WA0107.jpg" />
      </View>

    </Page>
  </Document>
);

export default DossierAulaVerde;
