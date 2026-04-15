import { CourseRequest } from '../types';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { creditTeacherWallet } from './wallet';

const DEMO_MODE = !isSupabaseConfigured;

// Stockage local des requêtes (mode demo)
let localRequests: CourseRequest[] = [];
const requestListeners: Map<string, (requests: CourseRequest[]) => void> = new Map();
const singleRequestListeners: Map<string, (request: CourseRequest | null) => void> = new Map();

// Notifier tous les listeners
const notifyListeners = () => {
  requestListeners.forEach((callback) => {
    callback([...localRequests].filter(r => r.status === 'pending'));
  });
};

const notifySingleListeners = (requestId: string) => {
  const request = localRequests.find(r => r.id === requestId);
  const listener = singleRequestListeners.get(requestId);
  if (listener) {
    listener(request || null);
  }
};

// Generate a unique video room link
const generateVideoLink = (): string => {
  const roomId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
  return `https://meet.jit.si/EduConnect-${roomId}`;
};

const mapSupabaseRequest = (row: {
  id: string;
  student_id: string;
  student_name: string;
  subject: string;
  level: string;
  description: string;
  status: CourseRequest['status'];
  teacher_id: string | null;
  teacher_name: string | null;
  video_link: string | null;
  created_at: string | null;
  accepted_at: string | null;
  duration_minutes: number | null;
  student_price: number | null;
  teacher_revenue: number | null;
  platform_commission: number | null;
  payment_status: CourseRequest['paymentStatus'] | null;
}): CourseRequest => ({
  id: row.id,
  studentId: row.student_id,
  studentName: row.student_name,
  subject: row.subject,
  level: row.level,
  description: row.description,
  status: row.status,
  teacherId: row.teacher_id || undefined,
  teacherName: row.teacher_name || undefined,
  videoLink: row.video_link || undefined,
  createdAt: row.created_at ? new Date(row.created_at) : new Date(),
  acceptedAt: row.accepted_at ? new Date(row.accepted_at) : undefined,
  durationMinutes: row.duration_minutes || 30,
  studentPrice: row.student_price || 7.50,
  teacherRevenue: row.teacher_revenue || 5.50,
  platformCommission: row.platform_commission || 2.00,
  paymentStatus: row.payment_status || 'pending',
});

const fetchRequestById = async (requestId: string): Promise<CourseRequest | null> => {
  const { data, error } = await supabase
    .from('course_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return mapSupabaseRequest(data);
};

const fetchPendingRequests = async (teacherSubjects: string[]): Promise<CourseRequest[]> => {
  let query = supabase
    .from('course_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (teacherSubjects.length > 0) {
    query = query.in('subject', teacherSubjects);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return (data || []).map(mapSupabaseRequest);
};

// Create a new course request
export const createCourseRequest = async (data: {
  studentId: string;
  studentName: string;
  subject: string;
  level: string;
  description: string;
  durationMinutes: number;
  studentPrice: number;
  teacherRevenue: number;
  platformCommission: number;
}): Promise<string> => {
  console.info('[requests] createCourseRequest:start', {
    studentId: data.studentId,
    subject: data.subject,
    level: data.level,
    durationMinutes: data.durationMinutes,
    studentPrice: data.studentPrice,
    descriptionLength: data.description.length,
    demoMode: DEMO_MODE,
  });

  void (async () => {
    try {
      const { data: sessionData, error: sessionError } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<Awaited<ReturnType<typeof supabase.auth.getSession>>>(
          (_resolve, reject) => {
            setTimeout(() => reject(new Error('Supabase getSession timeout')), 5000);
          }
        ),
      ]);
      console.info('[requests] session', {
        hasSession: Boolean(sessionData.session),
        sessionUserId: sessionData.session?.user?.id,
        sessionError: sessionError?.message,
      });
    } catch (error) {
      console.warn('[requests] session:check:error', error);
    }
  })();

  if (DEMO_MODE) {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    const request: CourseRequest = {
      id: requestId,
      studentId: data.studentId,
      studentName: data.studentName,
      subject: data.subject,
      level: data.level,
      description: data.description,
      status: 'pending',
      createdAt: new Date(),
      durationMinutes: data.durationMinutes,
      studentPrice: data.studentPrice,
      teacherRevenue: data.teacherRevenue,
      platformCommission: data.platformCommission,
      paymentStatus: 'pending',
    };

    localRequests.push(request);
    notifyListeners();
    notifySingleListeners(requestId);

    console.info('[requests] createCourseRequest:demo:success', { requestId });
    return requestId;
  }

  const { data: createdRequest, error } = await supabase
    .from('course_requests')
    .insert({
      student_id: data.studentId,
      student_name: data.studentName,
      subject: data.subject,
      level: data.level,
      description: data.description,
      status: 'pending',
      duration_minutes: data.durationMinutes,
      student_price: data.studentPrice,
      teacher_revenue: data.teacherRevenue,
      platform_commission: data.platformCommission,
      payment_status: 'pending',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[requests] createCourseRequest:supabase:error', error);
    throw error;
  }

  if (!createdRequest) {
    console.error('[requests] createCourseRequest:supabase:error', 'Insert returned no data');
    throw new Error('Insert returned no data');
  }

  console.info('[requests] createCourseRequest:supabase:success', { requestId: createdRequest.id });
  return createdRequest.id;
};

// Accept a course request
export const acceptRequest = async (
  requestId: string,
  teacherId: string,
  teacherName: string
): Promise<void> => {
  if (DEMO_MODE) {
    const request = localRequests.find(r => r.id === requestId);

    if (!request) {
      throw new Error('Request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request already accepted');
    }

    // Generate video link
    const videoLink = generateVideoLink();

    // Update the request
    request.status = 'accepted';
    request.teacherId = teacherId;
    request.teacherName = teacherName;
    request.videoLink = videoLink;
    request.acceptedAt = new Date();

    notifyListeners();
    notifySingleListeners(requestId);
    return;
  }

  const videoLink = generateVideoLink();

  const { data, error } = await supabase
    .from('course_requests')
    .update({
      status: 'accepted',
      teacher_id: teacherId,
      teacher_name: teacherName,
      video_link: videoLink,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('status', 'pending')
    .select('id')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error('Request already accepted');
  }
};

// Cancel a course request
export const cancelRequest = async (requestId: string): Promise<void> => {
  if (DEMO_MODE) {
    const request = localRequests.find(r => r.id === requestId);
    if (request) {
      request.status = 'cancelled';
      notifyListeners();
      notifySingleListeners(requestId);
    }
    return;
  }

  const { error } = await supabase
    .from('course_requests')
    .update({ status: 'cancelled' })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
};

// Complete a course request
export const completeRequest = async (requestId: string): Promise<void> => {
  if (DEMO_MODE) {
    const request = localRequests.find(r => r.id === requestId);
    if (request && request.status !== 'completed') {
      request.status = 'completed';
      request.paymentStatus = 'paid';

      // Crediter la cagnotte du professeur
      if (request.teacherId && request.teacherRevenue > 0) {
        const durationLabel = request.durationMinutes >= 60
          ? `${request.durationMinutes / 60}h`
          : `${request.durationMinutes} min`;
        await creditTeacherWallet(
          request.teacherId,
          request.teacherRevenue,
          requestId,
          `Cours de ${durationLabel} - ${request.subject}`,
          request.studentPrice,
          request.platformCommission
        );
      }

      notifyListeners();
      notifySingleListeners(requestId);
    }
    return;
  }

  const { error } = await supabase
    .from('course_requests')
    .update({ status: 'completed', payment_status: 'paid' })
    .eq('id', requestId);

  if (error) {
    throw error;
  }
  // Note: En production, le trigger SQL gere le credit automatiquement
};

// Subscribe to a single request's updates
export const subscribeToRequest = (
  requestId: string,
  callback: (request: CourseRequest | null) => void
): (() => void) => {
  if (DEMO_MODE) {
    singleRequestListeners.set(requestId, callback);

    // Initial callback
    const request = localRequests.find(r => r.id === requestId);
    callback(request || null);

    // Return unsubscribe function
    return () => {
      singleRequestListeners.delete(requestId);
    };
  }

  let isActive = true;

  fetchRequestById(requestId)
    .then((request) => {
      if (isActive) {
        callback(request);
      }
    })
    .catch(() => {
      if (isActive) {
        callback(null);
      }
    });

  const channel = supabase
    .channel(`course-request-${requestId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'course_requests', filter: `id=eq.${requestId}` },
      (payload) => {
        const rawRow = payload.new || payload.old;
        if (!rawRow || typeof rawRow !== 'object') {
          callback(null);
          return;
        }
        // Cast to Record for safe property access
        const row = rawRow as Record<string, unknown>;
        if (!row.id) {
          callback(null);
          return;
        }
        // Cast to the expected shape with defaults for pricing fields
        const mappedRow = {
          id: row.id as string,
          student_id: row.student_id as string,
          student_name: row.student_name as string,
          subject: row.subject as string,
          level: row.level as string,
          description: row.description as string,
          status: row.status as CourseRequest['status'],
          teacher_id: (row.teacher_id as string) || null,
          teacher_name: (row.teacher_name as string) || null,
          video_link: (row.video_link as string) || null,
          created_at: (row.created_at as string) || null,
          accepted_at: (row.accepted_at as string) || null,
          duration_minutes: (row.duration_minutes as number) || null,
          student_price: (row.student_price as number) || null,
          teacher_revenue: (row.teacher_revenue as number) || null,
          platform_commission: (row.platform_commission as number) || null,
          payment_status: (row.payment_status as CourseRequest['paymentStatus']) || null,
        };
        callback(mapSupabaseRequest(mappedRow));
      }
    )
    .subscribe();

  return () => {
    isActive = false;
    supabase.removeChannel(channel);
  };
};

// Subscribe to all pending requests for teachers
export const subscribeToPendingRequests = (
  teacherSubjects: string[],
  callback: (requests: CourseRequest[]) => void
): (() => void) => {
  if (DEMO_MODE) {
    const listenerId = `listener-${Date.now()}`;

    const filteredCallback = (requests: CourseRequest[]) => {
      const filtered = requests.filter(
        r => r.status === 'pending' &&
        (teacherSubjects.length === 0 || teacherSubjects.includes(r.subject))
      );
      callback(filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()));
    };

    requestListeners.set(listenerId, filteredCallback);

    // Initial callback
    filteredCallback(localRequests);

    // Return unsubscribe function
    return () => {
      requestListeners.delete(listenerId);
    };
  }

  let isActive = true;

  const fetchAndNotify = async () => {
    try {
      const requests = await fetchPendingRequests(teacherSubjects);
      if (isActive) {
        callback(requests);
      }
    } catch {
      if (isActive) {
        callback([]);
      }
    }
  };

  fetchAndNotify();

  const channel = supabase
    .channel(`pending-requests-${Date.now()}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'course_requests' }, () => {
      fetchAndNotify();
    })
    .subscribe();

  return () => {
    isActive = false;
    supabase.removeChannel(channel);
  };
};

// Get all requests for a specific student
export const getStudentRequests = async (studentId: string): Promise<CourseRequest[]> => {
  if (DEMO_MODE) {
    return localRequests
      .filter(r => r.studentId === studentId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const { data, error } = await supabase
    .from('course_requests')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapSupabaseRequest);
};

// Get all requests for a specific teacher
export const getTeacherRequests = async (teacherId: string): Promise<CourseRequest[]> => {
  if (DEMO_MODE) {
    return localRequests
      .filter(r => r.teacherId === teacherId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  const { data, error } = await supabase
    .from('course_requests')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapSupabaseRequest);
};

// Ajouter quelques demandes de demo au démarrage
const initDemoRequests = () => {
  if (DEMO_MODE && localRequests.length === 0) {
    // Ajouter des demandes de demo pour les professeurs
    localRequests.push({
      id: 'demo-req-001',
      studentId: 'demo-student-002',
      studentName: 'Emma',
      subject: 'Mathematiques',
      level: 'Terminale',
      description: 'Je ne comprends pas les integrales par parties. J\'ai un exercice a rendre demain.',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 1000), // Il y a 2 minutes
      durationMinutes: 30,
      studentPrice: 7.50,
      teacherRevenue: 5.50,
      platformCommission: 2.00,
      paymentStatus: 'pending',
    });

    localRequests.push({
      id: 'demo-req-002',
      studentId: 'demo-student-003',
      studentName: 'Thomas',
      subject: 'Physique-Chimie',
      level: 'Premiere',
      description: 'Besoin d\'aide sur les equations de mouvement. Je bloque sur un probleme de cinematique.',
      status: 'pending',
      createdAt: new Date(Date.now() - 5 * 60 * 1000), // Il y a 5 minutes
      durationMinutes: 45,
      studentPrice: 11.00,
      teacherRevenue: 8.50,
      platformCommission: 2.50,
      paymentStatus: 'pending',
    });
  }
};

// Initialiser les demandes demo
initDemoRequests();
