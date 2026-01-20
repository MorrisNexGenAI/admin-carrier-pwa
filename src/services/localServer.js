// ==================== src/services/localServer.js ====================
import { getAllContent } from './storage';

// Get local IP address (you'll need to manually set this or detect it)
export function getLocalServerURL() {
  // Common hotspot IPs
  const possibleIPs = [
    '192.168.43.1',  // Android hotspot
    '192.168.137.1', // Windows hotspot
    '172.20.10.1',   // iPhone hotspot
  ];
  
  // For now, return the first one (Android hotspot default)
  // In production, you'd detect the actual IP
  return `http://${possibleIPs[0]}:8080`;
}

// Handle API requests from local network
export async function handleLocalAPIRequest(endpoint, method = 'GET', body = null) {
  const content = await getAllContent();

  // Health check endpoint
  if (endpoint === '/health') {
    return {
      admin_pwa: true,
      online: true,
      last_sync: content.sync_info?.timestamp || null,
    };
  }

  // Departments
  if (endpoint === '/departments/') {
    return content.departments || [];
  }

  // Department courses
  if (endpoint.match(/^\/departments\/(\d+)\/courses\/$/)) {
    const deptId = parseInt(endpoint.match(/\/departments\/(\d+)\//)[1]);
    const courses = (content.courses || []).filter(c => 
      c.departments.includes(deptId)
    );
    return courses;
  }

  // Course topics
  if (endpoint.match(/^\/courses\/(\d+)\/topics\/$/)) {
    const courseId = parseInt(endpoint.match(/\/courses\/(\d+)\//)[1]);
    const topics = (content.topics || []).filter(t => 
      t.course_id === courseId
    );
    
    // Return topic metadata only
    return topics.map(t => ({
      id: t.id,
      title: t.title,
      page_range: t.page_range,
      updated_at: t.updated_at,
      is_refined: !!t.refined_summary,
      is_premium: t.is_premium,
    }));
  }

  // Topic detail
  if (endpoint.match(/^\/topics\/(\d+)\/$/)) {
    const topicId = parseInt(endpoint.match(/\/topics\/(\d+)\//)[1]);
    const topic = (content.topics || []).find(t => t.id === topicId);
    
    if (!topic) {
      throw new Error('Topic not found');
    }

    const course = (content.courses || []).find(c => c.id === topic.course_id);
    const departments = (content.departments || []).filter(d =>
      course?.departments.includes(d.id)
    );

    return {
      id: topic.id,
      title: topic.title,
      page_range: topic.page_range,
      refined_summary: topic.refined_summary,
      raw_text: topic.raw_text,
      course_name: course?.name || 'Unknown',
      course_year: course?.year || '',
      departments: departments.map(d => d.name),
      updated_at: topic.updated_at,
      created_at: topic.created_at,
      is_premium: topic.is_premium,
    };
  }

  throw new Error('Endpoint not found');
}
