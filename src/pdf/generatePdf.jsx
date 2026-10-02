// lazy loaded cuz pdf lib is big
import { pdf } from '@react-pdf/renderer'
import { ComplaintDocument } from './ComplaintDocument'

export function generateComplaintPdf(props) {
  return pdf(<ComplaintDocument {...props} />).toBlob()
}
