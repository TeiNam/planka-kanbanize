/**
 * Seed Function
 * (sails.config.bootstrap)
 *
 * A function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also create a hook.
 *
 * For more information on seeding your app with fake data, check out:
 * https://sailsjs.com/config/bootstrap
 */

const cron = require('node-cron');

module.exports.bootstrap = async () => {
  // 매일 자정(서버 로컬 타임존, TZ 환경변수 기준) 일별 스냅샷 생성 스케줄러 등록.
  // 스냅샷 날짜 라벨(utils/local-date.js)과 동일한 타임존 정책을 쓴다. TZ 미설정 시 UTC.
  cron.schedule('0 0 * * *', async () => {
    try {
      await sails.helpers.metrics.generateDailySnapshot();
    } catch (error) {
      sails.log.error('[cron] 일별 스냅샷 스케줄러 실행 실패:', error.message);
    }
  });

  sails.log.info('[cron] 일별 스냅샷 스케줄러 등록 완료 (매일 00:00, 서버 로컬 타임존)');
};
