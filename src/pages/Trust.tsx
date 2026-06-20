import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock, Database, Users, FileText, Mail, ArrowLeft } from "lucide-react";

const APP_NAME = "KageSan CRM";
const APP_OWNER = "el equipo de KageSan";
const CONTACT_EMAIL = "soporte@kagesan.es";

const Section = ({
  icon: Icon,
  title,
  children,
}: {
  icon: any;
  title: string;
  children: React.ReactNode;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center gap-3 space-y-0">
      <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="w-5 h-5" />
      </div>
      <CardTitle className="text-lg">{title}</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground space-y-2 leading-relaxed">
      {children}
    </CardContent>
  </Card>
);

const Trust = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="mb-6 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-7 h-7" />
            <Badge
              variant="secondary"
              className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20"
            >
              Centro de confianza
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Seguridad y privacidad en {APP_NAME}
          </h1>
          <p className="text-primary-foreground/80 text-base max-w-2xl">
            Esta página la mantiene {APP_OWNER} para responder a las preguntas
            más habituales sobre cómo protegemos los datos de las inmobiliarias
            que utilizan {APP_NAME}.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6 text-sm text-muted-foreground leading-relaxed">
            <p>
              <span className="font-medium text-foreground">
                Contenido editable por la organización.
              </span>{" "}
              Las afirmaciones de esta página están redactadas por {APP_OWNER} y
              describen los controles visibles dentro de la aplicación. No
              constituye una certificación ni una verificación independiente. La
              seguridad es una responsabilidad compartida entre la plataforma
              que aloja el servicio, {APP_OWNER} y cada inmobiliaria cliente.
            </p>
          </CardContent>
        </Card>

        <Section icon={Lock} title="Acceso y autenticación">
          <p>
            El acceso a {APP_NAME} requiere iniciar sesión. Soportamos
            autenticación con correo y contraseña, así como inicio de sesión con
            Google.
          </p>
          <p>
            Cada usuario pertenece a una inmobiliaria y a un rol (admin, socio,
            coordinadora o asesor). Los permisos de cada módulo se evalúan en el
            servidor en cada petición; los usuarios sin rol asignado no tienen
            acceso a los módulos.
          </p>
        </Section>

        <Section icon={Database} title="Aislamiento de datos entre inmobiliarias">
          <p>
            {APP_NAME} es una aplicación multi-tenant. Cada registro
            (propiedades, clientes, tareas, leads, documentos…) está asociado a
            la inmobiliaria a la que pertenece y se filtra a nivel de base de
            datos mediante políticas de fila, de modo que los datos de una
            inmobiliaria no son accesibles desde otra.
          </p>
          <p>
            Los datos en tránsito viajan cifrados sobre HTTPS/TLS. El
            almacenamiento gestionado por la plataforma aplica cifrado en
            reposo según las prácticas estándar del proveedor.
          </p>
        </Section>

        <Section icon={Users} title="Datos personales que tratamos">
          <p>
            {APP_NAME} trata datos de los propios usuarios de la aplicación
            (nombre, correo, teléfono) y datos de clientes y propietarios que
            cada inmobiliaria introduce en su CRM. Estos datos solo se utilizan
            para prestar el servicio contratado a la inmobiliaria, que actúa
            como responsable del tratamiento frente a sus propios contactos.
          </p>
        </Section>

        <Section icon={FileText} title="Conservación y eliminación">
          <p>
            Los registros que se eliminan desde la aplicación se marcan como
            archivados (borrado lógico) y pueden recuperarse desde la papelera
            durante un periodo razonable antes de su depuración definitiva. Las
            inmobiliarias pueden solicitar la eliminación completa de sus datos
            escribiendo al contacto indicado más abajo.
          </p>
        </Section>

        <Section icon={ShieldCheck} title="Subprocesadores e integraciones">
          <p>
            {APP_NAME} se apoya en un proveedor de infraestructura gestionada
            para alojamiento, base de datos, autenticación y almacenamiento de
            archivos. También integra de forma opcional portales inmobiliarios
            (Fotocasa, Idealista) cuando la inmobiliaria los activa, así como
            servicios de email transaccional.
          </p>
          <p>
            Para una lista detallada y actualizada de subprocesadores, escribe a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            .
          </p>
        </Section>

        <Section icon={Mail} title="Contacto de seguridad">
          <p>
            Si has detectado una posible vulnerabilidad o quieres ejercer
            derechos de acceso, rectificación o supresión de datos, escríbenos a{" "}
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-primary hover:underline"
            >
              {CONTACT_EMAIL}
            </a>
            . Te responderemos en el menor plazo posible.
          </p>
        </Section>

        <p className="text-xs text-muted-foreground text-center pt-4">
          Última revisión: {new Date().toLocaleDateString("es-ES", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
          . Esta página puede actualizarse para reflejar cambios en los
          controles o en los servicios utilizados.
        </p>
      </main>
    </div>
  );
};

export default Trust;
