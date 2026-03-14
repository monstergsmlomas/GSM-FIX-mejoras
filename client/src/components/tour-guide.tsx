import { useEffect } from 'react';
import { driver } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useLocation } from 'wouter';

// 👇 AQUÍ CREAMOS EL CONTRATO PARA TYPESCRIPT 👇
interface TourGuideProps {
  hasOrders?: boolean;
}

// 👇 SE LO ASIGNAMOS AL COMPONENTE 👇
export function TourGuide({ hasOrders }: TourGuideProps) {
  const [location] = useLocation();

  useEffect(() => {
    if (location !== "/dashboard") return;

    // Si el usuario ya tiene órdenes, marcamos el tour como completado en silencio y lo cancelamos.
    if (hasOrders) {
      localStorage.setItem('gsm_tour_completed', 'true');
      return;
    }

    const hasSeenTour = localStorage.getItem('gsm_tour_completed');

    if (!hasSeenTour) {
      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        doneBtnText: '¡Crear Orden! 🛠️',
        nextBtnText: 'Siguiente ➔',
        prevBtnText: '⬅',
        popoverClass: 'driverjs-theme',
        onDestroyed: () => {
          localStorage.setItem('gsm_tour_completed', 'true');
        },
        steps: [
          {
            popover: {
              title: '¡Bienvenido a tu Nuevo Taller! 🚀', // <-- TÍTULO
              description: 'GSM FIX está listo. Haremos un recorrido de 1 minuto para mostrarte dónde está cada herramienta.', // <-- DESCRIPCIÓN
              side: "over",
              align: 'center'
            }
          },
          {
            element: 'a[href="/dashboard"]',
            popover: {
              title: '📊 Panel de Control',
              description: 'Tu vista principal. Aquí verás el dinero en caja y el estado de las ordenes de tu negocio en tiempo real.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: 'a[href="/ordenes"]',
            popover: {
              title: '📱 Órdenes',
              description: 'Aquí administras los equipos, diagnósticos, señas y tiempos de entrega.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: 'a[href="/clientes"]',
            popover: {
              title: '👥 Clientes',
              description: 'Accede rápido al historial de reparaciones de cada cliente y contáctalos por WhatsApp.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: 'a[href="/cobros"]',
            popover: {
              title: '💰 Cobros y Caja',
              description: 'Tu punto de venta. Registra pagos, gastos diarios e imprime los tickets.',
              side: "right",
              align: 'start'
            }
          },

          {
            element: 'a[href="/reportes"]',
            popover: {
              title: '📈 Reportes',
              description: 'Analiza el rendimiento de tu negocio, ingresos, gastos y métricas clave a fin de mes.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: 'a[href="/inventory"]',
            popover: {
              title: '📦 Stock',
              description: 'Tu inventario de repuestos y productos. con alertas e informacion para que estes al tanto de como se encuentra el stock.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: 'a[href="/configuracion"]',
            popover: {
              title: '⚙️ Configuración',
              description: 'Personaliza tu logo, datos de contacto, términos legales y administra tu plan de pago.',
              side: "right",
              align: 'start'
            }
          },
          {
            element: '#tour-new-order',
            popover: {
              title: '¡Manos a la obra! 🎉',
              description: 'Ya conoces lo básico. Haz clic en este botón y anímate a crear tu primera Orden de Reparación de prueba.',
              side: "bottom",
              align: 'end'
            }
          }
        ]
      });

      setTimeout(() => {
        driverObj.drive();
      }, 800);
    }
  }, [location, hasOrders]);

  return null;
}