import Sidebar from '@/components/layout/Sidebar'
import MobileHeader from '@/components/layout/MobileHeader'
import AppLoader from '@/components/layout/AppLoader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppLoader />
      <MobileHeader />
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </>
  )
}
